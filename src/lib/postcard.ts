"use client";

import { mix, rgba } from "./color";
import { OCCASIONS } from "./presets";
import type { CardData } from "./types";

/**
 * A picture that announces the card – sent together with the link. Unlike an HTML file, an image
 * never triggers security warnings in mail or messengers, and it makes people curious to tap the link.
 */
export async function drawPostcard(d: CardData): Promise<Blob> {
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  // roundRect needs iOS 16 – plain rectangles are fine on older phones.
  const round = (x: number, y: number, w: number, h: number, r: number) => (g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h));
  const t = d.theme;
  const serif = 'Georgia, "Times New Roman", serif';
  const sans = '-apple-system, "Segoe UI", Roboto, Arial, sans-serif';

  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, t.bg);
  bg.addColorStop(1, t.bg2);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // Twinkling stars in the card's confetti colours (fixed pattern, so every picture looks tidy).
  const pal = t.confetti.length ? t.confetti : [t.accent];
  for (let i = 0; i < 46; i++) {
    const x = (i * 263) % W, y = (i * 379 + 120) % H, r = 6 + ((i * 7) % 14);
    g.fillStyle = rgba(pal[i % pal.length], 0.35 + ((i * 13) % 50) / 100);
    g.beginPath();
    g.moveTo(x, y - r);
    g.quadraticCurveTo(x, y, x + r, y);
    g.quadraticCurveTo(x, y, x, y + r);
    g.quadraticCurveTo(x, y, x - r, y);
    g.quadraticCurveTo(x, y, x, y - r);
    g.fill();
  }

  // The "card" in the middle.
  const x0 = 110, y0 = 250, w = W - 220, h = 820;
  g.save();
  g.shadowColor = rgba(t.accentDark, 0.35);
  g.shadowBlur = 60;
  g.fillStyle = rgba(t.card, 0.94);
  g.beginPath();
  round(x0, y0, w, h, 48);
  g.fill();
  g.restore();
  g.strokeStyle = rgba(t.accent, 0.8);
  g.lineWidth = 4;
  g.beginPath();
  round(x0 + 18, y0 + 18, w - 36, h - 36, 34);
  g.stroke();

  g.textAlign = "center";
  g.fillStyle = t.accent;
  g.font = `600 30px ${sans}`;
  g.fillText("✦  E I N E   K L E I N E   Ü B E R R A S C H U N G  ✦", W / 2, y0 + 120);

  const emoji = OCCASIONS.find((o) => o.id === d.occasion)?.emoji ?? "✨";
  g.font = `150px ${sans}`;
  g.fillText(emoji, W / 2, y0 + 330);

  g.fillStyle = t.text;
  g.font = `400 66px ${serif}`;
  const name = d.recipientName.trim();
  g.fillText(d.address === "sie" ? "Für Sie" : "Für dich", W / 2, y0 + 470);
  if (name) {
    g.font = `400 ${name.length > 18 ? 58 : 78}px ${serif}`;
    g.fillStyle = mix(t.accentDark, t.text, 0.4);
    g.fillText(name.length > 28 ? name.slice(0, 27) + "…" : name, W / 2, y0 + 570);
  }

  g.fillStyle = t.text2;
  g.font = `400 36px ${sans}`;
  g.fillText(d.address === "sie" ? "Tippen Sie auf den Link" : "Tipp auf den Link", W / 2, y0 + 690);
  g.fillText("und lass dich überraschen ✨".replace("lass dich", d.address === "sie" ? "lassen Sie sich" : "lass dich"), W / 2, y0 + 740);

  g.fillStyle = rgba(t.dark ? "#ffffff" : t.text, 0.55);
  g.font = `400 28px ${sans}`;
  g.fillText("Funkelpost", W / 2, H - 70);

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Bild konnte nicht erstellt werden."))), "image/png"));
}
