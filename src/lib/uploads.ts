/*
 * Checks for files people pick on their device – before anything is decoded or drawn.
 * A file's name and type can lie; its first bytes cannot.
 */

/** Largest photo that is read at all (it is shrunk afterwards anyway). */
export const PHOTO_MAX_BYTES = 25 * 1024 * 1024;
/** Largest PDF that is read at all. */
export const PDF_MAX_BYTES = 15 * 1024 * 1024;
/** Largest backup file that is read at all. */
export const BACKUP_MAX_BYTES = 20 * 1024 * 1024;

export type ImageKind = "jpeg" | "png" | "webp" | "gif" | "heic";

/** Picture format by its first bytes ("magic bytes"), or null for anything else (SVG, HTML, PDF …). */
export function imageKind(b: Uint8Array): ImageKind | null {
  const at = (i: number, s: string) => s.split("").every((c, j) => b[i + j] === c.charCodeAt(0));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b[0] === 0x89 && at(1, "PNG\r\n\x1a\n")) return "png";
  if (at(0, "RIFF") && at(8, "WEBP")) return "webp";
  if (at(0, "GIF87a") || at(0, "GIF89a")) return "gif";
  if (at(4, "ftyp") && ["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1", "avif"].some((t) => at(8, t))) return "heic";
  return null;
}

export function sizeLabel(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}
