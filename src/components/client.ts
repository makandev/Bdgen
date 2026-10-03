"use client";

export async function api<T = Record<string, unknown>>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
    headers: init?.body !== undefined ? { "content-type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 401 && !url.includes("/api/login")) {
    window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
    throw new Error("Bitte erneut anmelden.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Fehler ${res.status}`);
  return data as T;
}

export function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
