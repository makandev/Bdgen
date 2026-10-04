import { availableProviders } from "@/lib/ai";
import { handle, json, serverAI } from "@/server/http";

export function GET() {
  return handle(() => json({ providers: availableProviders(serverAI()) }));
}
