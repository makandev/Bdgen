import { json } from "@/lib/api";
import { availableProviders } from "@/lib/ai";

export function GET() {
  return json({ providers: availableProviders() });
}
