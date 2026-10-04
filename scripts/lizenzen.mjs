// Writes docs/LIZENZEN-DRITTANBIETER.md: every third-party package that ends up in the app, with its licence.
// Run after changing dependencies: `npm run lizenzen`.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
// pdfjs-dist is a dev dependency, but its files are copied into public/vendor and shipped.
const roots = [...Object.keys(pkg.dependencies ?? {}), "pdfjs-dist"];

const seen = new Map();
function visit(name, from) {
  let dir = join(from, "node_modules", name);
  if (!existsSync(dir)) dir = join(ROOT, "node_modules", name);
  if (!existsSync(join(dir, "package.json"))) return; // optional / platform-specific package not installed
  const p = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const key = `${p.name}@${p.version}`;
  if (seen.has(key)) return;
  const license = typeof p.license === "string" ? p.license : p.license?.type ?? "unbekannt";
  const repo = typeof p.repository === "string" ? p.repository : p.repository?.url ?? p.homepage ?? "";
  seen.set(key, { name: p.name, version: p.version, license, repo: repo.replace(/^git\+/, "").replace(/\.git$/, "") });
  for (const d of Object.keys(p.dependencies ?? {})) visit(d, dir);
}
for (const r of roots) visit(r, ROOT);

const rows = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
const byLicense = {};
for (const r of rows) byLicense[r.license] = (byLicense[r.license] ?? 0) + 1;

const md = `# Lizenzen von Fremd-Bibliotheken

Automatisch erzeugt mit \`npm run lizenzen\` – nicht von Hand bearbeiten.
Enthalten sind alle Pakete, die in der App landen (Laufzeit-Abhängigkeiten und \`pdfjs-dist\`), nicht die reinen Werkzeuge
zum Bauen und Testen.

**Zusammenfassung:** ${Object.entries(byLicense).map(([l, n]) => `${l}: ${n}`).join(" · ")}

Diese Lizenzen erlauben den kommerziellen Einsatz. Pflicht ist in der Regel, den Lizenztext bzw. Urheberhinweis
mitzuliefern (z. B. in einer „Lizenzen“-Seite der App oder als Datei beim Verkauf).

| Paket | Version | Lizenz | Quelle |
|---|---|---|---|
${rows.map((r) => `| ${r.name} | ${r.version} | ${r.license} | ${r.repo} |`).join("\n")}
`;
writeFileSync(join(ROOT, "docs/LIZENZEN-DRITTANBIETER.md"), md);
console.log(`docs/LIZENZEN-DRITTANBIETER.md: ${rows.length} Pakete`);
