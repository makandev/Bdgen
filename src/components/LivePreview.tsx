"use client";

import { useEffect, useState } from "react";
import { renderCardHTML } from "@/lib/render";
import type { CardData } from "@/lib/types";

/** Phone-framed live preview of card data; re-renders shortly after the last change so typing stays smooth. */
export function LivePreview({ data, caption }: { data: CardData; caption?: React.ReactNode }) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setHtml(renderCardHTML(data, { reactionMode: "preview" })), html ? 300 : 0);
    return () => clearTimeout(t);
  }, [data]);
  return (
    <div className="live-preview stack">
      <div className="phone">
        {html && <iframe className="preview-frame" title="Vorschau" srcDoc={html} sandbox="allow-scripts" />}
      </div>
      {caption && <p className="muted small" style={{ margin: 0, textAlign: "center" }}>{caption}</p>}
    </div>
  );
}
