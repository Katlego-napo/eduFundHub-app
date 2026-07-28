import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // pdfjs-dist dynamically imports its worker file (pdf.worker.mjs) at runtime.
  // If Next.js bundles it with webpack, that import gets rewritten to a
  // .next/.../chunks path that doesn't exist, causing:
  //   "Setting up fake worker failed: Cannot find module '...pdf.worker.mjs'"
  // Listing it here makes Next.js load it via plain Node `require`/`import`
  // from node_modules instead, where the worker file resolves correctly.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;