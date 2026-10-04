import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, Limiter } from "../src/server/limit";

test("login limit counts parallel tries and cannot be dodged with fake addresses", () => {
  const l = new Limiter(5, 60_000, 30, 600_000);
  const ok = Array.from({ length: 300 }, () => l.take("1.2.3.4")).filter(Boolean).length;
  assert.equal(ok, 5, "only 5 tries per address");
  let spoofed = 0;
  for (let i = 0; i < 100; i++) if (l.take(`10.0.0.${i}`)) spoofed++;
  assert.equal(spoofed, 25, "global cap (30) also holds for invented addresses");
});

test("client address is the entry our own proxy added (rightmost)", () => {
  const req = (xff?: string) => new Request("http://x/", { headers: xff ? { "x-forwarded-for": xff } : {} });
  assert.equal(clientIp(req("6.6.6.6, 203.0.113.9")), "203.0.113.9");
  assert.equal(clientIp(req()), "direct");
});
