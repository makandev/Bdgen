import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// The handbook (docs/handbuch) is the hand-over for the next developer. It has to stay current:
// every source file must be described, and every file it mentions must exist.
const ROOT = join(__dirname, "..");
const HANDBOOK = join(ROOT, "docs/handbuch");

function walk(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((f) => {
    const rel = `${dir}/${f}`;
    return statSync(join(ROOT, rel)).isDirectory() ? walk(rel) : [rel];
  });
}

const docs = readdirSync(HANDBOOK).filter((f) => f.endsWith(".md")).map((f) => readFileSync(join(HANDBOOK, f), "utf8")).join("\n");

test("every source file is described in the handbook", () => {
  const files = [...walk("src"), ...walk("scripts"), ...walk("tests")].filter((f) => /\.(ts|tsx|mjs|css|html|svg)$/.test(f));
  const missing = files.filter((f) => !docs.includes(`\`${f}\``));
  assert.deepEqual(missing, [], "please describe these files in docs/handbuch/11-dateien.md");
});

test("the handbook only mentions files that exist", () => {
  const mentioned = [...docs.matchAll(/`((?:src|scripts|tests|deploy|public|docs)\/[^`\s]+?\.[a-z]+)`/g)].map((m) => m[1]);
  const gone = [...new Set(mentioned)].filter((f) => !/[*<]/.test(f) && !existsSync(join(ROOT, f)) && !/^public\/(k|vendor)\//.test(f));
  assert.deepEqual(gone, [], "the handbook mentions files that no longer exist");
});
