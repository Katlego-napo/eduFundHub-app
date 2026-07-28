"use client";

import { Fragment } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export default function MathText({ text }: { text: string }) {
  if (!text) return null;

  const segments = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g).filter(Boolean);

  return (
    <span>
      {segments.map((segment, i) => {
        if (segment.startsWith("$$") && segment.endsWith("$$")) {
          const html = katex.renderToString(segment.slice(2, -2), {
            throwOnError: false,
            displayMode: true,
          });
          return (
            <span
              key={i}
              className="my-1 block overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        if (segment.startsWith("$") && segment.endsWith("$") && segment.length > 1) {
          const html = katex.renderToString(segment.slice(1, -1), {
            throwOnError: false,
            displayMode: false,
          });
          return (
            <span
              key={i}
              className="inline-block align-middle"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return <Fragment key={i}>{segment}</Fragment>;
      })}
    </span>
  );
}