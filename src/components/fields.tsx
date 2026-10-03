"use client";

export function Text({
  label, value, onChange, multiline, hint, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
  placeholder?: string;
}) {
  const rows = Math.min(8, Math.max(2, Math.ceil(value.length / 55) + (value.match(/\n/g)?.length ?? 0)));
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function List({
  label, items, onChange, multiline, addLabel = "+ Hinzufügen", max = 8,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  multiline?: boolean;
  addLabel?: string;
  max?: number;
}) {
  const update = (i: number, v: string) => onChange(items.map((x, k) => (k === i ? v : x)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="field">
      <span style={{ fontWeight: 600, color: "var(--text2)", fontSize: ".85rem" }}>{label}</span>
      <div className="list-edit">
        {items.map((it, i) => (
          <div className="row" key={i}>
            {multiline ? (
              <textarea rows={Math.min(6, Math.max(2, Math.ceil(it.length / 55)))} value={it} onChange={(e) => update(i, e.target.value)} />
            ) : (
              <input type="text" value={it} onChange={(e) => update(i, e.target.value)} />
            )}
            <button type="button" className="btn ghost sm icon" onClick={() => move(i, -1)} disabled={i === 0} title="Nach oben">↑</button>
            <button type="button" className="btn ghost sm icon" onClick={() => onChange(items.filter((_, k) => k !== i))} title="Entfernen">✕</button>
          </div>
        ))}
        {items.length < max && (
          <div>
            <button type="button" className="btn ghost sm" onClick={() => onChange([...items, ""])}>
              {addLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
