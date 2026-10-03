"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SERVER } from "@/lib/repo";

/** Chrome/Edge/Samsung: the browser's own install dialog, captured for our button. */
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type Platform =
  | "ios-safari" | "ios-other" | "ios-old" | "inapp"
  | "android-firefox" | "android-samsung" | "android-other"
  | "mac-safari" | "desktop-firefox" | "desktop-other";

const DISMISS_KEY = "funkelpost:install-dismissed";
let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    listeners.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((f) => f());
  });
}

export function detectPlatform(ua: string, maxTouchPoints = 0, platform = ""): Platform {
  const ios = /iPhone|iPad|iPod/.test(ua) || (platform === "MacIntel" && maxTouchPoints > 1) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
  // Apps that open links in their own little browser (Instagram, Facebook, TikTok, Google app …) cannot install.
  if (/FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|musical_ly|GSA\/|; wv\)/.test(ua)) return "inapp";
  if (ios) {
    const v = /OS (\d+)_(\d+)/.exec(ua);
    const ver = v ? Number(v[1]) + Number(v[2]) / 100 : 99;
    if (/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|DuckDuckGo/.test(ua)) return ver >= 16.04 ? "ios-other" : "ios-old";
    return "ios-safari";
  }
  if (/Android/.test(ua)) {
    if (/Firefox/.test(ua)) return "android-firefox";
    if (/SamsungBrowser/.test(ua)) return "android-samsung";
    return "android-other";
  }
  if (/Firefox/.test(ua)) return "desktop-firefox";
  if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg\//.test(ua)) return "mac-safari";
  return "desktop-other";
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function useInstall() {
  const [, force] = useState(0);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    setPlatform(detectPlatform(navigator.userAgent, navigator.maxTouchPoints || 0, navigator.platform || ""));
    setStandalone(isStandalone());
    const f = () => force((n) => n + 1);
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  }, []);
  return {
    platform,
    standalone,
    canPrompt: !!deferred,
    async prompt(): Promise<boolean> {
      if (!deferred) return false;
      const ev = deferred;
      await ev.prompt();
      const choice = await ev.userChoice.catch(() => ({ outcome: "dismissed" as const }));
      deferred = null;
      force((n) => n + 1);
      return choice.outcome === "accepted";
    },
  };
}

function ShareIcon() {
  return (
    <svg className="ios-share" viewBox="0 0 24 24" width="20" height="20" aria-label="Teilen-Symbol" role="img">
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Step-by-step instructions for the device in hand. */
export function InstallSteps({ platform, canPrompt, onPrompt }: { platform: Platform; canPrompt: boolean; onPrompt: () => void }) {
  if (canPrompt) {
    return (
      <div className="stack">
        <p>Ein Tipp genügt – dein Browser fragt kurz nach, dann liegt Funkelpost wie eine App auf deinem Gerät.</p>
        <button className="btn" onClick={onPrompt}>📲 Jetzt installieren</button>
      </div>
    );
  }
  switch (platform) {
    case "ios-safari":
      return (
        <ol className="install-steps">
          <li>Tippe auf <b>Teilen</b> <ShareIcon /> – unten in der Leiste (bei neuem iOS erst auf <b>•••</b> tippen).</li>
          <li>Nach unten wischen und <b>„Zum Home-Bildschirm“</b> wählen.</li>
          <li>Schalter <b>„Als Web-App öffnen“</b> anlassen und oben rechts <b>„Hinzufügen“</b> tippen.</li>
          <li>Fertig! Funkelpost liegt jetzt als ✦-Symbol auf deinem Home-Bildschirm.</li>
        </ol>
      );
    case "ios-other":
      return (
        <ol className="install-steps">
          <li>Tippe auf <b>Teilen</b> <ShareIcon /> (bei Chrome oben rechts neben der Adresse).</li>
          <li><b>„Zum Home-Bildschirm“</b> wählen und <b>„Hinzufügen“</b> tippen.</li>
          <li>Klappt es nicht? Die Seite in <b>Safari</b> öffnen und dort genauso vorgehen.</li>
        </ol>
      );
    case "ios-old":
      return <p>Auf diesem iPhone geht das Installieren nur in <b>Safari</b>: Link kopieren, in Safari öffnen, dann <b>Teilen</b> <ShareIcon /> → <b>„Zum Home-Bildschirm“</b>.</p>;
    case "inapp":
      return (
        <ol className="install-steps">
          <li>Du bist gerade im eingebauten Browser einer App (z. B. Instagram). Dort geht Installieren nicht.</li>
          <li>Tippe auf <b>•••</b> oder <b>⋮</b> und wähle <b>„Im Browser öffnen“</b> (iPhone: „In Safari öffnen“).</li>
          <li>Dann hier wieder auf <b>„App installieren“</b> tippen.</li>
        </ol>
      );
    case "android-firefox":
      return <p>Tippe oben rechts auf <b>⋮</b> und dann auf <b>„Installieren“</b> bzw. <b>„Zum Startbildschirm hinzufügen“</b>.</p>;
    case "android-samsung":
      return <p>Tippe unten auf <b>≡</b>, dann <b>„Seite hinzufügen zu“</b> → <b>„Startbildschirm“</b>.</p>;
    case "android-other":
      return <p>Tippe oben rechts auf <b>⋮</b> und dann auf <b>„App installieren“</b> oder <b>„Zum Startbildschirm hinzufügen“</b>.</p>;
    case "mac-safari":
      return <p>Oben in der Menüleiste: <b>Ablage</b> → <b>„Zum Dock hinzufügen …“</b> (ab macOS Sonoma).</p>;
    case "desktop-firefox":
      return <p>Firefox am Computer kann Web-Apps nicht installieren. Öffne die Seite in <b>Chrome</b> oder <b>Edge</b> – oder setz dir einfach ein Lesezeichen ⭐.</p>;
    default:
      return <p>In der Adressleiste rechts auf das Installieren-Symbol <b>⊕</b> klicken – oder im Browser-Menü <b>⋮</b> → <b>„App installieren“</b>.</p>;
  }
}

function StorageNote({ platform }: { platform: Platform }) {
  if (SERVER) return <p className="small muted">In der installierten App meldest du dich einmal neu an – deine Karten liegen ja auf dem Server.</p>;
  if (!platform.startsWith("ios")) return null;
  return (
    <p className="small install-note">
      ⚠️ Wichtig fürs iPhone: Die App auf dem Home-Bildschirm hat einen <b>eigenen Speicher</b>. Personen &amp; Karten, die du hier in Safari angelegt hast,
      sind dort erst nach dem Übertragen da: vorher in <Link href="/einstellungen/">⚙ Einstellungen</Link> „Sicherung herunterladen“, in der App dann „Sicherung einspielen“.
    </p>
  );
}

/** Small "install" button bottom right on phones and tablets (and wherever the browser offers it). */
/** Pages with editors keep the corner free – there it lives in the settings instead. */
const FAB_PAGES = /^\/((beispiele|infos|login)\/?)?$/;

export function InstallFab() {
  const { platform, standalone, canPrompt, prompt } = useInstall();
  const path = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
      setHidden(Date.now() - t < 14 * 864e5);
    } catch {
      setHidden(false);
    }
  }, []);

  if (!platform || standalone || hidden || !FAB_PAGES.test(path)) return null;
  const mobile = /^(ios|android|inapp)/.test(platform);
  if (!mobile && !canPrompt) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setHidden(true);
    setOpen(false);
  };

  return (
    <>
      <div className="install-spacer" aria-hidden="true" />
      <div className="install-fab">
        <button type="button" className="install-open" onClick={() => (canPrompt ? prompt() : setOpen(true))}>📲 App installieren</button>
        <button type="button" className="install-x" onClick={dismiss} aria-label="Ausblenden">✕</button>
      </div>
      {open && (
        <div className="intro-backdrop" role="dialog" aria-modal="true" aria-label="App installieren" onClick={() => setOpen(false)}>
          <div className="panel stack install-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>📲 Funkelpost aufs Handy</h2>
              <button className="btn ghost sm icon" onClick={() => setOpen(false)} aria-label="Schließen">✕</button>
            </div>
            <InstallSteps platform={platform} canPrompt={canPrompt} onPrompt={() => prompt().then(() => setOpen(false))} />
            <StorageNote platform={platform} />
            <button type="button" className="btn ghost sm" onClick={dismiss}>Nicht mehr anzeigen</button>
          </div>
        </div>
      )}
    </>
  );
}

/** The same instructions as a section in the settings – always reachable, even after hiding the button. */
export function InstallSection() {
  const { platform, standalone, canPrompt, prompt } = useInstall();
  if (!platform) return null;
  return (
    <section className="panel stack">
      <h2>📲 Als App installieren</h2>
      {standalone ? (
        <p>✅ Funkelpost läuft gerade schon als installierte App.</p>
      ) : (
        <>
          <InstallSteps platform={platform} canPrompt={canPrompt} onPrompt={() => prompt()} />
          <StorageNote platform={platform} />
        </>
      )}
    </section>
  );
}
