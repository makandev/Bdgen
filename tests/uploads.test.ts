import { test } from "node:test";
import assert from "node:assert/strict";
import { zlibSync, strToU8 } from "fflate";
import { BACKUP_MAX_BYTES, imageKind, PDF_MAX_BYTES, PHOTO_MAX_BYTES } from "../src/lib/uploads";
import { pdfIsPlain } from "../src/lib/validate";

const bin = (u: Uint8Array) => Array.from(u, (b) => String.fromCharCode(b)).join("");
const pdf = (body: string) => `data:application/pdf;base64,${btoa(`%PDF-1.7\n${body}\n%%EOF`)}`;
const stream = (dict: string, data: string, compress = true) => {
  const raw = compress ? bin(zlibSync(strToU8(data))) : data;
  return `5 0 obj\n<< ${dict} /Length ${raw.length} >>\nstream\n${raw}\nendstream\nendobj`;
};

test("PDF: active content hidden in a compressed object stream is found", () => {
  const hidden = stream("/Type /ObjStm /N 1 /First 4 /Filter /FlateDecode", "7 0 << /S /JavaScript /JS (app.alert(1)) >>");
  assert.equal(pdfIsPlain(pdf(hidden)), false);
  const hex = stream("/Type /ObjStm /N 1 /First 4 /Filter /FlateDecode", "7 0 << /S /J#61vaScript >>");
  assert.equal(pdfIsPlain(pdf(hex)), false);
  const action = stream("/Filter /FlateDecode", "<< /OpenAction 9 0 R >>");
  assert.equal(pdfIsPlain(pdf(action)), false);
});

test("PDF: normal compressed pages stay allowed", () => {
  assert.equal(pdfIsPlain(pdf(stream("/Filter /FlateDecode", "BT /F1 24 Tf 100 700 Td (Gutschein 50 Euro) Tj ET"))), true);
  assert.equal(pdfIsPlain(pdf(stream("/Type /ObjStm /N 1 /First 4 /Filter /FlateDecode", "7 0 << /Type /Page >>"))), true);
});

test("PDF: object streams that cannot be read, and zip bombs, are rejected", () => {
  assert.equal(pdfIsPlain(pdf(stream("/Type /ObjStm /N 1 /First 4 /Filter /LZWDecode", "kaputt", false))), false);
  assert.equal(pdfIsPlain(pdf(stream("/Type /ObjStm /N 1 /First 4 /Filter /FlateDecode", "kein zlib", false))), false);
  const t = Date.now();
  assert.equal(pdfIsPlain(pdf(stream("/Filter /FlateDecode", "A".repeat(60_000_000)))), false);
  assert.ok(Date.now() - t < 5000, "a bomb is stopped early");
});

test("uploads: only real pictures by their first bytes, sizes are limited", () => {
  const b = (...x: number[]) => new Uint8Array([...x, ...new Array(16).fill(0)]);
  assert.equal(imageKind(b(0xff, 0xd8, 0xff, 0xe0)), "jpeg");
  assert.equal(imageKind(b(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), "png");
  assert.equal(imageKind(strToU8("RIFF\0\0\0\0WEBPVP8 ")), "webp");
  assert.equal(imageKind(strToU8("\0\0\0\x18ftypheic\0\0\0\0")), "heic");
  assert.equal(imageKind(strToU8("GIF89a")), "gif");
  for (const evil of ["<svg onload=alert(1)>", "<!doctype html><script>", "%PDF-1.7", ""]) assert.equal(imageKind(strToU8(evil)), null);
  assert.ok(PHOTO_MAX_BYTES <= 30e6 && PDF_MAX_BYTES <= 20e6 && BACKUP_MAX_BYTES <= 25e6);
});
