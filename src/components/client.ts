export function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function download(filename: string, content: string, type: string) {
  // A home-screen app on the iPhone cannot download – there the share sheet offers "In Dateien sichern".
  const nav = navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true && typeof File !== "undefined") {
    const file = new File([content], filename, { type });
    if (nav.canShare?.({ files: [file] })) {
      nav.share({ files: [file] }).catch(() => {});
      return;
    }
  }
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Copies text; also works without navigator.clipboard (plain http in the home network). True = really copied. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.top = "0";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  el.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {}
  el.remove();
  return ok;
}
