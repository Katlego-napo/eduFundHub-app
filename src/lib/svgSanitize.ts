/**
 * SVG sanitizer for quiz diagrams.
 *
 * We don't use DOMParser here because this runs in both server-side
 * (Node.js) and client-side contexts. Instead we use regex-based
 * stripping for the well-known dangerous patterns — this is appropriate
 * for our use case because:
 *   1. The SVG source is AI-generated or admin-authored (not arbitrary
 *      user input from the general public).
 *   2. We remove entire dangerous elements and all event attributes
 *      wholesale, rather than trying to allowlist specific SVG features.
 *   3. The result is then set via dangerouslySetInnerHTML inside a
 *      sandboxed container — see DiagramRenderer for how this is done.
 *
 * Security posture: defence in depth. AI/admin generates the SVG →
 * this sanitizer removes dangerous patterns → React renders into a
 * constrained container. The sanitizer is the middle layer, not the
 * only layer.
 */

const MAX_SVG_BYTES = 50_000; // 50 KB — generous for educational diagrams

// Elements that can execute code or inject external resources.
const DANGEROUS_ELEMENTS = [
  "script",
  "iframe",
  "object",
  "embed",
  "foreignObject",
  "use", // can reference external resources via href
  "image", // can load external images (we allow data: URIs only)
  "animate", // can trigger JS-like behaviour in some contexts
  "set",
  "animateMotion",
  "animateTransform",
];

// Event handler attribute pattern — matches any on* attribute.
const EVENT_HANDLER_RE = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;

// javascript: URLs in href/xlink:href/src/action attributes.
const JAVASCRIPT_URL_RE =
  /(\s+(?:href|xlink:href|src|action)\s*=\s*["'])javascript:/gi;

// data: URIs other than image types (e.g. data:text/html).
// We allow data:image/* since those are safe inline images.
const DANGEROUS_DATA_URI_RE =
  /(\s+(?:href|xlink:href|src)\s*=\s*["'])data:(?!image\/)/gi;

function stripElement(svg: string, tag: string): string {
  // Remove self-closing variants: <tag ... />
  const selfClosing = new RegExp(`<${tag}[^>]*/\\s*>`, "gi");
  // Remove paired variants: <tag ...>...</tag>
  const paired = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, "gi");
  return svg.replace(selfClosing, "").replace(paired, "");
}

export type SanitizeResult =
  | { ok: true; svg: string }
  | { ok: false; error: string };

export function sanitizeSvg(raw: string): SanitizeResult {
  if (!raw || !raw.trim()) {
    return { ok: false, error: "SVG content is empty." };
  }

  const trimmed = raw.trim();

  // Must start with an <svg tag.
  if (!trimmed.toLowerCase().startsWith("<svg")) {
    return {
      ok: false,
      error: 'SVG content must start with an <svg> tag.',
    };
  }

  // Must close with </svg>.
  if (!trimmed.toLowerCase().endsWith("</svg>")) {
    return { ok: false, error: "SVG content must end with </svg>." };
  }

  // Size check — before any processing.
  if (new Blob([trimmed]).size > MAX_SVG_BYTES) {
    return {
      ok: false,
      error: `SVG is too large (max ${MAX_SVG_BYTES / 1000} KB). Simplify the diagram.`,
    };
  }

  let svg = trimmed;

  // Strip dangerous elements.
  for (const tag of DANGEROUS_ELEMENTS) {
    svg = stripElement(svg, tag);
  }

  // Strip event handler attributes.
  svg = svg.replace(EVENT_HANDLER_RE, "");

  // Strip javascript: URLs.
  svg = svg.replace(JAVASCRIPT_URL_RE, "$1#");

  // Strip dangerous data: URIs.
  svg = svg.replace(DANGEROUS_DATA_URI_RE, "$1data:image/gif;base64,");

  // Final check — if <script> survived somehow (e.g. nested/obfuscated),
  // reject the whole SVG rather than risk execution.
  if (/<script/i.test(svg)) {
    return {
      ok: false,
      error: "SVG contains a <script> element and cannot be used.",
    };
  }

  return { ok: true, svg };
}

export function isValidSvgShell(raw: string): boolean {
  const t = raw.trim().toLowerCase();
  return t.startsWith("<svg") && t.endsWith("</svg>");
}