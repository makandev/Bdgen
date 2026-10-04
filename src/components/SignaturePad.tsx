"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INK_H, INK_W, MAX_INK_POINTS, MAX_INK_STROKES, inkPath, inkPoints, packStroke } from "@/lib/ink";

type Pt = [number, number];

/** Sign with finger or mouse. Stores strokes as numbers (lib/ink.ts), never as a picture. */
export function SignaturePad({ value, onChange }: { value: number[][] | undefined; onChange: (ink: number[][] | undefined) => void }) {
  const ink = value ?? [];
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef<Pt[] | null>(null);
  const [full, setFull] = useState(false);

  const setup = useCallback(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return null;
    const w = c.getBoundingClientRect().width || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (c.width !== Math.round(w * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round((w * dpr * INK_H) / INK_W);
    }
    const scale = c.width / INK_W;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.lineWidth = (2.6 * dpr) / scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#23232b";
    return ctx;
  }, []);

  const redraw = useCallback(() => {
    const ctx = setup();
    if (!ctx) return;
    ctx.clearRect(0, 0, INK_W, INK_H);
    for (const s of ink) ctx.stroke(new Path2D(inkPath(s)));
  }, [ink, setup]);

  useEffect(() => {
    redraw();
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
  }, [redraw]);

  const at = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * INK_W, ((e.clientY - r.top) / r.height) * INK_H];
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (ink.length >= MAX_INK_STROKES || inkPoints(ink) >= MAX_INK_POINTS) return setFull(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    live.current = [at(e)];
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pts = live.current;
    if (!pts) return;
    const p = at(e);
    const last = pts[pts.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 2) return;
    pts.push(p);
    const ctx = setup();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(last[0], last[1]);
    ctx.lineTo(p[0], p[1]);
    ctx.stroke();
  };

  const up = () => {
    const pts = live.current;
    live.current = null;
    if (!pts) return;
    const stroke = packStroke(pts);
    if (inkPoints(ink) + stroke.length / 2 > MAX_INK_POINTS) {
      setFull(true);
      redraw();
      return;
    }
    onChange([...ink, stroke]);
  };

  return (
    <div className="field">
      <span style={{ fontWeight: 600, color: "var(--text2)", fontSize: ".85rem" }}>✍️ Handschriftlich unterschreiben (optional)</span>
      <canvas
        ref={canvas}
        className="sign-pad"
        aria-label="Feld zum Unterschreiben"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn ghost sm" disabled={!ink.length} onClick={() => (setFull(false), onChange(ink.length > 1 ? ink.slice(0, -1) : undefined))}>
          ↶ Letzten Strich weg
        </button>
        <button type="button" className="btn danger sm" disabled={!ink.length} onClick={() => (setFull(false), onChange(undefined))}>
          Löschen
        </button>
      </div>
      <small className="muted">
        {full
          ? "Die Unterschrift ist voll – lösche sie oder einen Strich, um neu zu zeichnen."
          : "Mit Finger oder Maus. In der Karte wird sie im Finale wie mit Tinte nachgezeichnet."}
      </small>
    </div>
  );
}
