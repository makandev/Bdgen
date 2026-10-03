"use client";

import { BASE } from "./base";
import { MAX_PDF_CHARS } from "./validate";

/** How big a voucher picture may get. Browser version: the picture travels inside the link, so it stays small. */
export function imageBudget(server: boolean) {
  return server ? { maxSide: 1600, maxChars: 700_000 } : { maxSide: 1000, maxChars: 48_000 };
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    r.readAsDataURL(blob);
  });
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Dieses Bild kann der Browser nicht öffnen. Bitte als JPG oder PNG versuchen."));
    img.src = url;
  });
}

/** Shrinks a picture to a JPEG data URL that fits the budget (quality first, then size). */
export function compressToJpeg(src: CanvasImageSource & { width: number; height: number }, budget: { maxSide: number; maxChars: number }): string {
  let side = budget.maxSide;
  for (let round = 0; round < 8; round++) {
    const scale = Math.min(1, side / Math.max(src.width, src.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(src.width * scale));
    c.height = Math.max(1, Math.round(src.height * scale));
    const g = c.getContext("2d")!;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(src, 0, 0, c.width, c.height);
    for (const q of [0.82, 0.7, 0.58, 0.46]) {
      const url = c.toDataURL("image/jpeg", q);
      if (url.length <= budget.maxChars) return url;
    }
    side = Math.round(side * 0.78);
  }
  throw new Error("Das Bild ist zu groß. Bitte einen Ausschnitt oder Screenshot verwenden.");
}

export async function imageFileToVoucher(file: File, server: boolean): Promise<string> {
  const img = await loadImage(file);
  try {
    return compressToJpeg(img, imageBudget(server));
  } finally {
    URL.revokeObjectURL(img.src);
  }
}

type PdfLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(o: { data: Uint8Array }): { promise: Promise<{ getPage(n: number): Promise<PdfPage> }> };
};
type PdfPage = {
  getViewport(o: { scale: number }): { width: number; height: number };
  render(o: Record<string, unknown>): { promise: Promise<void> };
};

/** Loads pdf.js only when someone actually picks a PDF (it is big). */
async function pdfLib(): Promise<PdfLib> {
  const url = `${window.location.origin}${BASE}/vendor/pdfjs/pdf.min.js`;
  const lib = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url)) as PdfLib;
  lib.GlobalWorkerOptions.workerSrc = `${window.location.origin}${BASE}/vendor/pdfjs/pdf.worker.min.js`;
  return lib;
}

/** First page of a PDF as voucher picture; on the server the original PDF is kept for download. */
export async function pdfFileToVoucher(file: File, server: boolean): Promise<{ image: string; pdf: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let image: string;
  try {
    const lib = await pdfLib();
    const doc = await lib.getDocument({ data: bytes.slice() }).promise;
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(3, 1600 / Math.max(base.width, base.height)) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    image = compressToJpeg(canvas, imageBudget(server));
  } catch (e) {
    console.warn("PDF-Umwandlung fehlgeschlagen:", e);
    throw new Error("Das PDF konnte hier nicht umgewandelt werden. Tipp: Mach einen Screenshot vom Gutschein und lade ihn als Foto hoch.");
  }
  let pdf = "";
  if (server) {
    const url = await readAsDataUrl(file);
    if (url.startsWith("data:application/pdf;base64,") && url.length <= MAX_PDF_CHARS) pdf = url;
  }
  return { image, pdf };
}
