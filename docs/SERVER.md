# ✦ Funkelpost – Server-Installation

Diese Anleitung bringt die **Server-Version** von Funkelpost auf deinen eigenen Server. Danach sehen alle
Geräte dieselben Personen und Karten, die KI-Schlüssel liegen sicher auf dem Server, und geteilte Links
sind kurz und jederzeit abschaltbar.

> Keine Lust auf Server? Die Browser-Version läuft ohne Installation auf GitHub Pages.

---

## 1. Was du brauchst

| | |
|---|---|
| **Einen Linux-Server** | z. B. einen kleinen Mietserver (VPS, ca. 4–6 €/Monat), einen Raspberry Pi 4/5 oder ein NAS mit Docker. 1 GB RAM reicht. |
| **Docker** | Das Installationsskript kann es dir automatisch installieren. |
| **Optional: eine Domain** | z. B. `karten.meinname.de` – dann gibt es automatisch HTTPS (Schloss-Symbol). Ohne Domain läuft Funkelpost im Heimnetz per IP-Adresse. |
| **Einen KI-Schlüssel** | kostenlos bei [Google AI Studio](https://aistudio.google.com/apikey) (empfohlen) oder [OpenRouter](https://openrouter.ai/keys). |

---

## 2. Installation in 3 Schritten

**Schritt 1 – mit dem Server verbinden** (am Computer im Terminal, unter Windows in „PowerShell“):

```bash
ssh benutzer@IP-DEINES-SERVERS
```

**Schritt 2 – Funkelpost herunterladen:**

```bash
git clone https://github.com/makandev/Bdgen.git funkelpost
cd funkelpost
```

> Falls `git` fehlt: `sudo apt install -y git` (Debian/Ubuntu/Raspberry Pi OS).

**Schritt 3 – Installation starten:**

```bash
./install.sh
```

Das Skript fragt dich nach:

1. **Passwort** für die App – leer lassen, dann wird ein sicheres erzeugt und angezeigt (notieren!)
2. **Gemini-Schlüssel** – einfügen oder leer lassen und später nachtragen
3. **OpenRouter-Schlüssel** – optional, als Ersatz wenn Gemini ausgelastet ist
4. **Domain** – leer lassen für den Betrieb im Heimnetz

Danach baut es Funkelpost, startet es und zeigt dir die Adresse an. **Fertig!** 🎉

---

## 3. Mit eigener Domain & HTTPS

1. Beim Domain-Anbieter einen **A-Eintrag** anlegen: `karten.meinname.de` → IP deines Servers.
2. Am Server/Router die Ports **80** und **443** freigeben.
3. Bei `./install.sh` die Domain angeben (oder später: `./install.sh --neu`).

Funkelpost startet dann zusätzlich [Caddy](https://caddyserver.com), das sich automatisch um das HTTPS-Zertifikat
(Let's Encrypt) kümmert und es selbst erneuert. Die App selbst ist dann nur noch über HTTPS erreichbar.

## 4. Nur im Heimnetz (ohne Domain)

Funkelpost ist unter `http://IP-DES-SERVERS:3000` erreichbar – z. B. `http://192.168.1.20:3000`.
Das Skript setzt dafür automatisch `COOKIE_SECURE=false`, damit der Login auch ohne HTTPS klappt.

> **Wichtig:** Ohne HTTPS nicht ins Internet freigeben – das Passwort würde unverschlüsselt übertragen.
> Empfänger-Links funktionieren dann auch nur im Heimnetz.

---

## 5. Alltag

| Was | Befehl |
|---|---|
| Aktualisieren (holt die neueste Version, macht vorher eine Sicherung) | `./update.sh` |
| Sicherung der Datenbank nach `./backups/` | `./backup.sh` |
| Protokoll ansehen | `docker compose logs -f funkelpost` |
| Neu starten | `docker compose restart` |
| Stoppen / Starten | `docker compose down` / `docker compose up -d` |
| Passwort oder Schlüssel ändern | `nano .env` bearbeiten, dann `docker compose up -d` |
| Alles neu einrichten | `./install.sh --neu` |

**Automatische Sicherung jede Nacht** (um 3 Uhr): `crontab -e` öffnen und diese Zeile ergänzen
(Pfad anpassen):

```
0 3 * * * cd /home/benutzer/funkelpost && ./backup.sh >/dev/null 2>&1
```

### Sicherung zurückspielen

```bash
docker compose stop funkelpost
docker compose cp backups/funkelpost-2026-10-03-0300.db funkelpost:/app/data/funkelpost.db
docker compose start funkelpost
```

### Daten aus der Browser-Version übernehmen

In der Browser-Version unter **⚙ Einstellungen → Sicherung herunterladen**, danach in der Server-Version unter
**⚙ Einstellungen → Sicherung einspielen** die Datei auswählen. Fertig.

---

## 6. Ohne Docker (für Fortgeschrittene)

Voraussetzung: **Node.js 22.5 oder neuer**.

```bash
cp .env.example .env    # APP_PASSWORD, AUTH_SECRET und KI-Schlüssel eintragen
npm ci
npm run build:server
npm run start:server    # läuft auf Port 3000
```

Als Dienst, der beim Hochfahren startet: siehe `deploy/funkelpost.service` (systemd).
Für HTTPS einen Reverse-Proxy davorsetzen, z. B. mit nginx:

```nginx
server {
  server_name karten.meinname.de;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## 7. Hilfe, es klappt nicht

| Problem | Lösung |
|---|---|
| Login klappt nicht, die Seite lädt einfach neu | Läuft ohne HTTPS? Dann in `.env` `COOKIE_SECURE=false` setzen und `docker compose up -d`. |
| „Zu viele Versuche“ | Nach 5 falschen Passwörtern ist der Login 1 Minute gesperrt. Kurz warten. |
| KI schreibt nichts | In der App unter **⚙ Einstellungen → KI testen**. Meist fehlt der Schlüssel in `.env` oder das Gratis-Kontingent ist kurz ausgeschöpft. |
| Port 3000 ist belegt | In `.env` z. B. `PORT=3100` setzen, dann `docker compose up -d`. |
| HTTPS-Zertifikat kommt nicht | Zeigt die Domain wirklich auf den Server? Sind Port 80 und 443 offen? `docker compose logs caddy` zeigt den Grund. |
| Raspberry Pi: Bauen dauert lange | Beim ersten Mal sind 10–15 Minuten normal. |

---

## 8. Sicherheit auf einen Blick

- Die App ist komplett passwortgeschützt; ohne Passwort erreichbar sind nur Empfänger-Links (`/k/…`) und Reaktionen darauf.
- Die Links sind zufällig und nicht erratbar. Du kannst jeden Link in der Karte unter **📨 Teilen** abschalten.
- KI-Schlüssel und Passwort stehen nur in `.env` auf dem Server (nur für den Besitzer lesbar) und erreichen nie den Browser.
- Der Name der Person wird nie an die KI geschickt.
- Nach 5 falschen Passwörtern wird der Login für 1 Minute gesperrt.
