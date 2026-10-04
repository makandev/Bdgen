/**
 * Small in-memory rate limits for the public endpoints.
 *
 * The client IP is the RIGHTMOST X-Forwarded-For entry – the one our own reverse proxy
 * (Caddy, nginx with $remote_addr/$proxy_add_x_forwarded_for) added. Without a proxy the
 * header is client-controlled, so every limit also has a global cap that cannot be dodged
 * by inventing addresses.
 */
export function clientIp(req: Request): string {
  const parts = (req.headers.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1].slice(0, 64) : "direct";
}

export class Limiter {
  private per = new Map<string, number[]>();
  private all: number[] = [];

  constructor(private perKey: number, private perWindowMs: number, private global: number, private globalWindowMs: number) {}

  /** Records one attempt right away (no await before it, so parallel requests all count). False = blocked. */
  take(key: string): boolean {
    const now = Date.now();
    this.all = this.all.filter((t) => now - t < this.globalWindowMs);
    const mine = (this.per.get(key) ?? []).filter((t) => now - t < this.perWindowMs);
    if (mine.length >= this.perKey || this.all.length >= this.global) return false;
    mine.push(now);
    this.all.push(now);
    this.per.set(key, mine);
    if (this.per.size > 2000) {
      for (const [k, v] of this.per) if (!v.length || now - v[v.length - 1] > this.perWindowMs) this.per.delete(k);
    }
    return true;
  }

  /** Forget a key's attempts (e.g. after a successful login). */
  clear(key: string) {
    const n = this.per.get(key)?.length ?? 0;
    this.per.delete(key);
    this.all.splice(Math.max(0, this.all.length - n), n);
  }
}
