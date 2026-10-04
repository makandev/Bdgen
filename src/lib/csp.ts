/*
 * Content-Security-Policy – the second line of defence behind validate.ts/esc(): even if markup
 * slipped through, it could neither load code from elsewhere nor send data anywhere.
 */

/** AI services the browser version talks to directly. */
export const AI_ORIGINS = ["https://generativelanguage.googleapis.com", "https://openrouter.ai"];

/** localStorage key with the origin of a custom OpenRouter-compatible address (not secret). */
export const CSP_EXTRA_KEY = "bdgen:csp-extra";

/** Only a plain https origin may be added to the policy. */
export function safeOrigin(url: string | undefined): string {
  try {
    const u = new URL(String(url || ""));
    return u.protocol === "https:" && /^[a-z0-9.-]+(:\d+)?$/i.test(u.host) ? u.origin : "";
  } catch {
    return "";
  }
}

/** Policy for the app. Next.js needs inline scripts and styles; everything else stays local. */
export function appCSP(connect: string[]): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' data: blob:",
    `connect-src 'self' ${connect.join(" ")}`.trim(),
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join("; ");
}

/** Policy inside every card: nothing from outside, network only for reactions on the own server. */
export function cardCSP(reactions: boolean): string {
  return [
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline'",
    "img-src data: blob:",
    "media-src data: blob:",
    "font-src data:",
    `connect-src ${reactions ? "'self'" : "'none'"}`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
}

/**
 * Tiny inline script for the static app: adds the policy as <meta> before Next.js starts,
 * including a custom AI address the person entered on this device.
 */
export function cspBootScript(): string {
  const base = JSON.stringify(appCSP(AI_ORIGINS));
  return `(function(){var x="";try{x=localStorage.getItem(${JSON.stringify(CSP_EXTRA_KEY)})||""}catch(e){}if(!/^https:\\/\\/[a-z0-9.-]+(:\\d+)?$/i.test(x))x="";var m=document.createElement("meta");m.httpEquiv="Content-Security-Policy";m.content=${base}.replace("connect-src 'self'","connect-src 'self'"+(x?" "+x:""));document.head.appendChild(m)})();`;
}
