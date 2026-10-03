"use client";

import { useState } from "react";
import { api, errText } from "@/components/client";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/login", { body: { password } });
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } catch (err) {
      setError(errText(err));
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <form className="panel stack" onSubmit={submit}>
        <div style={{ fontSize: "1.25rem", letterSpacing: ".55em", color: "var(--accent)" }}>✦ ✧ ✦</div>
        <div className="eyebrow">Privater Bereich</div>
        <h1>Bdgen</h1>
        <p className="muted" style={{ margin: 0 }}>Persönliche Überraschungen für die Menschen, die dir wichtig sind.</p>
        <input
          type="password"
          placeholder="Passwort"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="notice err">{error}</div>}
        <button className="btn" disabled={busy || !password}>
          {busy ? <span className="spinner" /> : "Entsperren →"}
        </button>
      </form>
    </main>
  );
}
