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
