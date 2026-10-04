// Generates files in public/ before dev/build:
//  - public/k/index.html: the standalone card viewer (works on older iPhones, no Next.js runtime)
//  - public/vendor/pdfjs/: pdf.js, loaded only when someone attaches a PDF voucher
import { build, transform } from "esbuild";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
// Start page card: a static file the showcase iframe loads (keeps the page itself small).
const show = await build({ entryPoints: [join(root, "scripts/viewer/showcase.ts")], bundle: true, platform: "node", format: "esm", write: false });
const tmp = join(tmpdir(), `funkelpost-showcase-${process.pid}.mjs`);
writeFileSync(tmp, show.outputFiles[0].text);
try {
  writeFileSync(join(pub, "showcase.html"), (await import(pathToFileURL(tmp).href)).showcaseHTML());
} finally {
  rmSync(tmp, { force: true });
}

const pdf = join(root, "node_modules/pdfjs-dist/legacy/build");
mkdirSync(join(pub, "vendor/pdfjs"), { recursive: true });
// pdf.js calls structuredClone (iOS 15.4+); this covers what it clones: plain data, typed arrays, Map, Set, Date.
const CLONE_POLYFILL = `/*funkelpost:clone*/if(typeof globalThis.structuredClone!=="function"){globalThis.structuredClone=function(v){var seen=new Map();function c(x){if(x===null||typeof x!=="object")return x;if(seen.has(x))return seen.get(x);var o;if(ArrayBuffer.isView(x)){o=x instanceof DataView?new DataView(x.buffer.slice(0)):x.slice()}else if(x instanceof ArrayBuffer){o=x.slice(0)}else if(x instanceof Date){o=new Date(x.getTime())}else if(x instanceof Map){o=new Map();seen.set(x,o);x.forEach(function(val,k){o.set(c(k),c(val))});return o}else if(x instanceof Set){o=new Set();seen.set(x,o);x.forEach(function(val){o.add(c(val))});return o}else{o=Array.isArray(x)?[]:{};seen.set(x,o);for(var k in x)if(Object.prototype.hasOwnProperty.call(x,k))o[k]=c(x[k]);return o}seen.set(x,o);return o}return c(v)}}\n`;

// Even the legacy build uses syntax from Safari 16.4 (class static blocks) – lower it for iOS 15.
for (const [from, to] of [["pdf.min.mjs", "pdf.min.js"], ["pdf.worker.min.mjs", "pdf.worker.min.js"]]) {
  const r = await transform(readFileSync(join(pdf, from), "utf8"), { target: "safari15", format: "esm", minify: true, legalComments: "none" });
  writeFileSync(join(pub, "vendor/pdfjs", to), CLONE_POLYFILL + r.code);
}
console.log(`public/k/index.html (${Math.round(html.length / 1024)} KB), showcase.html + pdf.js ready`);
