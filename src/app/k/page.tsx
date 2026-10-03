"use client";

import { useEffect, useState } from "react";
import { renderCardHTML } from "@/lib/render";
import { decodeCard } from "@/lib/share";

export default function Viewer() {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const load = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return setFailed(true);
      decodeCard(hash).then((d) => {
        if (!d) return setFailed(true);
        const doc = renderCardHTML(d);
        document.title = doc.match(/<title>([^<]*)<\/title>/)?.[1].replace(/&amp;/g, "&") ?? "Überraschung";
        setHtml(doc);
      });
    };
    load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, []);

  if (failed) {
    return (
      <main className="login">
        <div className="panel stack" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.4rem", color: "var(--accent)" }}>✦</div>
          <p>Dieser Link ist unvollständig. Bitte den ganzen Link öffnen – manchmal wird er beim Kopieren abgeschnitten.</p>
        </div>
      </main>
    );
  }
  if (!html) return <main className="login"><span className="spinner" /></main>;
  // Sandboxed without same-origin: a crafted link can never reach this site's storage.
  return <iframe className="viewer" title="Überraschung" srcDoc={html} sandbox="allow-scripts" allow="fullscreen" />;
}
