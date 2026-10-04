# 6 · Sicherheit

## Was geschützt wird – und wovor

| Schutzgut | Bedrohung | Maßnahme |
|---|---|---|
| KI-Schlüssel | Veröffentlichung über GitHub/Webseite | Schlüssel nur auf dem Gerät; CI bekommt **keine** Secrets und bricht ab, wenn im Build etwas wie ein Schlüssel steht (`.github/workflows/pages.yml`) |
| KI-Schlüssel auf dem Gerät | andere Personen am Gerät, andere Seiten unter `<name>.github.io` (gleicher Ursprung!) | optionales **Geräte-Passwort**: nur Chiffretext in `localStorage` (PBKDF2 600 000 + AES-GCM, `src/lib/vault.ts`), Klartext nur in `sessionStorage` des offenen Tabs (`src/lib/settings.ts`) |
| Daten der App | präparierte Karten-Links (XSS) | Prüfung aller Eingaben (`validate.ts`), Escaping (`render.ts`), Anzeige im **sandbox-iframe ohne same-origin** |
| Server-Login | Passwort-Raten | `src/server/limit.ts`: 5 Versuche/Minute je Adresse **und** 30 Fehlversuche/10 Minuten insgesamt; der Versuch wird vor jedem `await` gezählt |
| Server-Login | Umleitung auf fremde Seiten | `safeNext()` in `src/app/login/page.tsx` lässt nur gleiche Herkunft zu |
| Sitzung | Fälschung | HMAC-signiertes Cookie, `httpOnly`, `SameSite=Lax`, `secure` in Produktion (`src/server/session.ts`) |
| Reaktionen (öffentlich) | Spam | nur die Knöpfe der Karte, max. 30 je Karte, Limits je Adresse und gesamt |
| Empfänger | Schad-PDF als Gutschein | `pdfIsPlain()` in `src/lib/validate.ts`: Original-PDF nur ohne Skripte, Startbefehle, Anhänge, Auto-Aktionen (auch hex-maskierte Namen); pdf.js zeichnet ohne Skripting/`eval` (`src/lib/media.ts`); sonst wird nur das Bild verschickt |
| Build/Lieferkette | kompromittierte npm-Pakete | `npm ci --ignore-scripts` (CI + Docker), Dependabot (`.github/dependabot.yml`), CodeQL (`.github/workflows/codeql.yml`) |
| Empfänger | Datenabfluss | keine externen Ressourcen in Karten, `referrer: no-referrer`, `noindex` |
| Alle | eingeschleuster Code lädt nach oder schickt Daten weg | **Content-Security-Policy** (`src/lib/csp.ts`): Karten `default-src 'none'`, Netz nur für Reaktionen zum eigenen Server; Viewer ohne Netz; App nur eigene Dateien + Gemini/OpenRouter (+ eigene https-Adresse aus den Einstellungen); Server zusätzlich `frame-ancestors 'none'`, `nosniff`, `X-Frame-Options`, `Permissions-Policy` (`next.config.ts`) |

## Regeln für neuen Code

1. **Nie** Schlüssel, Passwörter oder Secrets in Code, Build, Links oder Logs.
2. Alles von außen (Link, KI, Sicherung, API-Body) durch `validate.ts`.
3. Text in HTML nur über `esc()`/`fmt()`. Neue Attribute mit Benutzerdaten immer maskieren.
4. Bilder nur als geprüfte `data:`-URL – nie fremde Adressen laden.
5. Karten nur im sandbox-iframe anzeigen. Ausnahme bewusst: iOS < 13 rendert der Viewer direkt
   (`document.write`), weil alte iPhones iframes falsch skalieren. Das ist vertretbar, weil das HTML
   vollständig aus geprüften Daten entsteht – deshalb ist Regel 2/3 hier besonders wichtig.
6. Die KI bekommt nie Namen oder Gutscheine.
7. Neue Netzwerkziele (andere KI-Dienste, Schriften, Bilder von außen) müssen in `src/lib/csp.ts`
   eingetragen werden – sonst blockiert der Browser sie. Das ist Absicht: jede Ausnahme bewusst prüfen.

## Bekannte Grenzen

- Die CSP erlaubt Inline-Skripte (`'unsafe-inline'`), weil Next.js und die Karten sie brauchen. Sie
  verhindert also kein eingeschleustes Skript, wohl aber, dass es etwas nachlädt oder Daten wegschickt.
  Auf GitHub Pages kommt die Regel per `<meta>` (Pages kann keine Header setzen); `frame-ancestors`
  wirkt dort deshalb nicht.

- GitHub Pages teilt sich den Ursprung `<benutzer>.github.io` mit allen anderen Pages-Projekten
  desselben Kontos. Ohne Geräte-Passwort könnten diese Seiten die Schlüssel lesen. Abhilfe: Geräte-
  Passwort einschalten oder eine eigene Domain verwenden.
- Server-Sitzungen sind zustandslos (30 Tage); ein gestohlenes Cookie lässt sich nur durch Ändern von
  `AUTH_SECRET` ungültig machen. Ohne `AUTH_SECRET` wird mit dem App-Passwort signiert (Warnung im Log).
- Hinter keinem Reverse-Proxy ist `X-Forwarded-For` fälschbar – deshalb die globale Grenze beim Login.
