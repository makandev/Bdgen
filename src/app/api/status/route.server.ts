import { availableProviders } from "@/lib/ai";
import { json, serverAI } from "@/server/http";

export function GET() {
  return json({ providers: availableProviders(serverAI()) });
}
