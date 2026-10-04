/**
 * Writes out/zugang.json: the AI keys encrypted with BDGEN_PASSWORD.
 * Without a password or without any key, no file is written and the app runs unlocked.
 */
import { writeFileSync } from "node:fs";
import { sealVault } from "../src/lib/vault";

const env = (k: string) => (process.env[k] || "").trim();
const password = env("BDGEN_PASSWORD");
const config = {
  gemini: env("GEMINI_API_KEY") || undefined,
  openrouter: env("OPENROUTER_API_KEY") || undefined,
  geminiModel: env("GEMINI_MODEL") || undefined,
  openrouterModel: env("OPENROUTER_MODEL") || undefined,
  provider: (env("AI_PROVIDER") || undefined) as "gemini" | "openrouter" | undefined,
};

async function main() {
if (!password) {
  console.log("BDGEN_PASSWORD nicht gesetzt – die App wird ohne Passwortsperre veröffentlicht.");
} else if (!config.gemini && !config.openrouter) {
  console.log("Kein KI-Schlüssel gesetzt – die App wird ohne Passwortsperre veröffentlicht.");
} else {
  // zugang.json is public – the password is all that protects the AI keys, and it can be guessed offline.
  if (password.length < 14) console.warn("::warning::BDGEN_PASSWORD ist kurz. Weil zugang.json öffentlich abrufbar ist, empfehlen sich mindestens 14 Zeichen (z. B. vier zufällige Wörter) – und ein Ausgabenlimit beim KI-Anbieter.");
  const vault = await sealVault(config, password);
  writeFileSync(process.argv[2] || "out/zugang.json", JSON.stringify(vault));
  console.log("Passwortsperre aktiv: zugang.json geschrieben.");
}
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
