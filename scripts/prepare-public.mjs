// Generates files in public/ before dev/build:
//  - public/k/index.html: the standalone card viewer (works on older iPhones, no Next.js runtime)
//  - public/vendor/pdfjs/: pdf.js, loaded only when someone attaches a PDF voucher
import { build } from "esbuild";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");

const out = await build({
  entryPoints: [join(root, "scripts/viewer/entry.ts")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  // ES2017 runs on iOS 11+ (iPhone 5s and newer); esbuild lowers ?. ?? and object spread.
  // (esbuild's "safari11" target refuses plain destructuring because of an old edge-case bug, so ES2017 it is.)
  target: "es2017",
  legalComments: "none",
  charset: "utf8",
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
for (const bad of ["structuredClone", "replaceAll(", "Object.fromEntries", "CompressionStream", "DecompressionStream", "findLast", "Promise.withResolvers"]) {
  if (js.includes(bad)) throw new Error(`Viewer bundle uses ${bad} – not available on older iPhones.`);
}
const html = readFileSync(join(root, "scripts/viewer/index.html"), "utf8").replace("/*VIEWER*/", () => js);
mkdirSync(join(pub, "k"), { recursive: true });
writeFileSync(join(pub, "k/index.html"), html);

// The "legacy" build carries polyfills – the modern one needs browser features from 2026 (fails even in current Chrome/Safari).
const pdf = join(root, "node_modules/pdfjs-dist/legacy/build");
mkdirSync(join(pub, "vendor/pdfjs"), { recursive: true });
copyFileSync(join(pdf, "pdf.min.mjs"), join(pub, "vendor/pdfjs/pdf.min.js"));
copyFileSync(join(pdf, "pdf.worker.min.mjs"), join(pub, "vendor/pdfjs/pdf.worker.min.js"));
console.log(`public/k/index.html (${Math.round(html.length / 1024)} KB) + pdf.js ready`);
