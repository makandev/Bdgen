export type Provider = "gemini" | "openrouter";

export class AIError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
  }
}

export function availableProviders(): Provider[] {
  const keys: Record<Provider, boolean> = {
    gemini: !!process.env.GEMINI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
  };
  const preferred = process.env.AI_PROVIDER as Provider | undefined;
  const order: Provider[] = preferred === "openrouter" ? ["openrouter", "gemini"] : ["gemini", "openrouter"];
  return order.filter((p) => keys[p]);
}

export function aiEnabled(): boolean {
  return availableProviders().length > 0;
}

const TIMEOUT_MS = 90_000;

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 300);
    try {
      const j = JSON.parse(text);
      msg = j.error?.message ?? j.message ?? msg;
    } catch {}
    throw new AIError(`HTTP ${res.status}: ${msg}`, res.status === 429 ? 429 : 502);
  }
  return JSON.parse(text);
}

async function callGemini(system: string, user: string, temperature: number): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const data = (await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    { "x-goog-api-key": process.env.GEMINI_API_KEY! },
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature, responseMimeType: "application/json" },
    },
  )) as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[] };
  const cand = data.candidates?.[0];
  const text = cand?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new AIError(`Gemini lieferte keinen Text (${cand?.finishReason ?? "unbekannt"}).`);
  return text;
}

async function callOpenRouter(system: string, user: string, temperature: number): Promise<string> {
  const model = process.env.OPENROUTER_MODEL || "openrouter/free";
  const data = (await post(
    `${(process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "")}/chat/completions`,
    {
      authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "x-title": "Bdgen",
    },
    {
      model,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
  )) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new AIError(`OpenRouter lieferte keinen Text${data.error?.message ? `: ${data.error.message}` : ""}.`);
  return text;
}

export function extractJSON(text: string): unknown {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {}
  const first = t.search(/[[{]/);
  const last = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (first >= 0 && last > first) {
    const slice = t.slice(first, last + 1);
    try {
      return JSON.parse(slice);
    } catch {
      // Common model slip: trailing commas.
      return JSON.parse(slice.replace(/,\s*([}\]])/g, "$1"));
    }
  }
  throw new AIError("Die KI-Antwort war kein gültiges JSON.");
}

/** Sends the prompt to the first working provider and parses the JSON answer. */
export async function askJSON(system: string, user: string, temperature = 0.9): Promise<{ json: unknown; provider: Provider }> {
  const providers = availableProviders();
  if (!providers.length) {
    throw new AIError("Kein KI-Schlüssel hinterlegt. Bitte GEMINI_API_KEY oder OPENROUTER_API_KEY in .env eintragen.", 503);
  }
  const errors: string[] = [];
  for (const p of providers) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = p === "gemini" ? await callGemini(system, user, temperature) : await callOpenRouter(system, user, temperature);
        return { json: extractJSON(text), provider: p };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${p}: ${msg}`);
        // Rate limits go straight to the next provider; malformed output gets one retry.
        if (e instanceof AIError && e.status === 429) break;
        if (!(e instanceof AIError) || !msg.includes("JSON")) break;
      }
    }
  }
  const limited = errors.some((e) => e.includes("429"));
  throw new AIError(
    (limited ? "Das kostenlose KI-Kontingent ist gerade ausgeschöpft – bitte kurz warten und erneut versuchen. " : "KI-Anfrage fehlgeschlagen. ") +
      errors.join(" | "),
    limited ? 429 : 502,
  );
}
