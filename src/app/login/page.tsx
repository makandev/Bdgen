"use client";

import { Sparkles } from "@/components/Sparkles";
import { useEffect, useState } from "react";
import { errText } from "@/components/client";
import { BASE, HOME } from "@/lib/base";
import { SERVER } from "@/lib/repo";

/** Login for the server version. The browser version unlocks inside the app instead. */
/** Only same-site paths – "/\\evil.com" or "/<Tab>/evil.com" would otherwise leave the site. */
function safeNext(next: string | null): string {
  const fallback = BASE + HOME;
  if (!next || !next.startsWith("/")) return fallback;
  try {
    const u = new URL(BASE + next, window.location.origin);
    return u.origin === window.location.origin ? u.pathname + u.search : fallback;
  } catch {
    return fallback;
  }
}

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!SERVER) window.location.replace(`${BASE}${HOME}`);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/login/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || `Fehler ${res.status}`);
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = safeNext(next);
    } catch (err) {
      setError(errText(err));
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <Sparkles />
      <form className="panel stack" onSubmit={submit}>
        <div style={{ fontSize: "1.25rem", letterSpacing: ".55em", color: "var(--accent)" }}>✦ ✧ ✦</div>
        <div className="eyebrow">Privater Bereich</div>
        <h1>Funkelpost</h1>
        <p className="muted" style={{ margin: 0 }}>Persönliche Überraschungen für die Menschen, die dir wichtig sind.</p>
        <input type="password" placeholder="Passwort" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="notice err">{error}</div>}
        <button className="btn" disabled={busy || !password}>{busy ? <span className="spinner" /> : "Anmelden →"}</button>
      </form>
    </main>
  );
}
