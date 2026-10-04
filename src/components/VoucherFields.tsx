"use client";

import { useState } from "react";
import { imageFileToVoucher, pdfFileToVoucher } from "@/lib/media";
import { SERVER } from "@/lib/repo";
import type { Voucher } from "@/lib/types";
import { Text } from "./fields";

type Mode = "none" | "code" | "foto" | "pdf";

const empty = (): Voucher => ({ kind: "code", label: "", code: "", image: "", pdf: "", note: "", show: true });

/** Optional voucher on the gift page: a code, a photo or a PDF – revealed after a fireworks show. */
export function VoucherFields({ value, onChange }: { value: Voucher | null | undefined; onChange: (v: Voucher | null) => void }) {
  const [mode, setMode] = useState<Mode>(!value ? "none" : value.kind === "code" ? "code" : value.pdf ? "pdf" : "foto");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const v = value ?? empty();
  const set = (patch: Partial<Voucher>) => onChange({ ...v, ...patch });

  function pick(m: Mode) {
    setMode(m);
    setErr("");
    if (m === "none") return onChange(null);
    if (m === "code") return onChange({ ...v, kind: "code", image: "", pdf: "" });
    // Picture modes keep the picture until a new file is chosen; label, note and show stay in every mode.
    if (v.kind !== "image") onChange({ ...v, kind: "image", code: "", image: "", pdf: "" });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      if (mode === "pdf" || file.type === "application/pdf") {
        const { image, pdf, note } = await pdfFileToVoucher(file, SERVER);
        onChange({ ...v, kind: "image", image, pdf, code: "" });
        if (note) setErr(note);
      } else {
        const image = await imageFileToVoucher(file, SERVER);
        onChange({ ...v, kind: "image", image, pdf: "", code: "" });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Das hat nicht geklappt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sub voucher-edit">
      <strong className="small">🎟️ Gutschein dazu (optional)</strong>
      <div className="chips">
        {([["none", "Kein Gutschein"], ["code", "🔢 Code"], ["foto", "📷 Foto"], ["pdf", "📄 PDF"]] as [Mode, string][]).map(([m, label]) => (
          <button key={m} type="button" className={`chip${mode === m ? " on" : ""}`} onClick={() => pick(m)}>{label}</button>
        ))}
      </div>
      {mode !== "none" && (
        <>
          {mode === "code" ? (
            <Text label="Gutschein-Code" value={v.code} placeholder="z. B. ABCD-1234-EFGH" onChange={(code) => onChange({ ...v, kind: "code", code, image: "", pdf: "" })} hint="Die Person kann ihn mit einem Tipp kopieren." />
          ) : (
            <label className="field">
              <span>{mode === "pdf" ? "PDF-Gutschein auswählen" : "Foto vom Gutschein auswählen"}</span>
              <input type="file" accept={mode === "pdf" ? "application/pdf,.pdf" : "image/*"} disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
              <small>
                {mode === "pdf" ? "Die erste Seite wird als Bild gezeigt" : "Wird automatisch verkleinert"}
                {SERVER ? (mode === "pdf" ? " – das Original-PDF kann die Person zusätzlich speichern." : ".") : " – damit der Link kurz genug für WhatsApp bleibt."}
              </small>
            </label>
          )}
          {busy && <p className="small"><span className="spinner" /> Wird vorbereitet …</p>}
          {err && <p className="small" style={{ color: "var(--danger, #b3261e)" }}>{err}</p>}
          {v.kind === "image" && v.image && mode !== "code" && (
            <div className="voucher-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.image} alt="Vorschau Gutschein" />
              <small className="muted">{Math.round((v.image.length * 3) / 4 / 1024)} KB{v.pdf ? " · Original-PDF dabei" : ""}</small>
            </div>
          )}
          <Text label="Was steht groß drauf?" value={v.label} placeholder="z. B. 50 € Wellness-Tag" onChange={(label) => set({ label })} hint="Leer lassen = Name des Geschenks." />
          <Text label="Kleingedrucktes (optional)" value={v.note} placeholder="z. B. einlösbar bis 31.12." onChange={(note) => set({ note })} />
          <label className="toggle">
            <input type="checkbox" checked={v.show} onChange={(e) => set({ show: e.target.checked })} />
            🎆 Feuerwerk-Show mit Countdown, bevor der Gutschein erscheint
          </label>
        </>
      )}
    </div>
  );
}
