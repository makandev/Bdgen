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
| Empfänger | Datenabfluss | keine externen Ressourcen in Karten, `referrer: no-referrer`, `noindex` |

## Regeln für neuen Code

1. **Nie** Schlüssel, Passwörter oder Secrets in Code, Build, Links oder Logs.
2. Alles von außen (Link, KI, Sicherung, API-Body) durch `validate.ts`.
3. Text in HTML nur über `esc()`/`fmt()`. Neue Attribute mit Benutzerdaten immer maskieren.
4. Bilder nur als geprüfte `data:`-URL – nie fremde Adressen laden.
5. Karten nur im sandbox-iframe anzeigen. Ausnahme bewusst: iOS < 13 rendert der Viewer direkt
   (`document.write`), weil alte iPhones iframes falsch skalieren. Das ist vertretbar, weil das HTML
   vollständig aus geprüften Daten entsteht – deshalb ist Regel 2/3 hier besonders wichtig.
6. Die KI bekommt nie Namen oder Gutscheine.

## Bekannte Grenzen

- GitHub Pages teilt sich den Ursprung `<benutzer>.github.io` mit allen anderen Pages-Projekten
  desselben Kontos. Ohne Geräte-Passwort könnten diese Seiten die Schlüssel lesen. Abhilfe: Geräte-
  Passwort einschalten oder eine eigene Domain verwenden.
- Server-Sitzungen sind zustandslos (30 Tage); ein gestohlenes Cookie lässt sich nur durch Ändern von
  `AUTH_SECRET` ungültig machen. Ohne `AUTH_SECRET` wird mit dem App-Passwort signiert (Warnung im Log).
- Hinter keinem Reverse-Proxy ist `X-Forwarded-For` fälschbar – deshalb die globale Grenze beim Login.
