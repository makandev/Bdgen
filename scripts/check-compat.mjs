// After the browser build: make sure nothing slipped in that breaks on iPhones with iOS 15.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dirs = ["out/_next/static/chunks", "out/vendor/pdfjs"];
const banned = [["static{", "class static blocks (iOS 16.4)"], ["structuredClone(", "structuredClone (iOS 15.4)"], ["crypto.randomUUID", "randomUUID (iOS 15.4, secure context)"]];
let bad = 0;
for (const d of dirs) {
  for (const f of readdirSync(d).filter((x) => x.endsWith(".js"))) {
    const code = readFileSync(join(d, f), "utf8");
    // pdf.js brings its own fallbacks (prepare-public.mjs adds structuredClone; randomUUID is feature-checked there).
    const vendored = code.startsWith("/*funkelpost:clone*/");
    for (const [needle, what] of banned) {
      if (vendored && needle !== "static{") continue;
      if (code.includes(needle)) (bad++, console.error(`${d}/${f}: ${what}`));
    }
  }
}
if (bad) process.exit(1);
console.log("compat check ok (iOS 15+)");
