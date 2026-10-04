"use client";

import { useState } from "react";
import { RELATION_GROUPS, relationEmoji } from "@/lib/presets";

export function RelationPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="field">
      <span style={{ fontWeight: 600, color: "var(--text2)", fontSize: ".85rem" }}>Wer ist das für dich?</span>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <span className="rel-emoji" aria-hidden="true">{relationEmoji(value)}</span>
        <input type="text" value={value} placeholder="z. B. Tochter, Oma, Kollegin" onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="btn ghost sm" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "▴" : "Auswahl ▾"}
        </button>
      </div>
      {open && (
        <div className="rel-groups">
          {RELATION_GROUPS.map((g) => (
            <div key={g.group}>
              <div className="rel-group">{g.group}</div>
              <div className="chips">
                {g.items.map(([name, emoji]) => (
                  <button
                    key={name}
                    type="button"
                    className={`chip${value === name ? " on" : ""}`}
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                    }}
                  >
                    {emoji} {name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
