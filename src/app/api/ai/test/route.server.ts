import { testAI } from "@/lib/prompts";
import { handle, json, serverAI } from "@/server/http";

export function POST() {
  return handle(async () => json({ message: await testAI(serverAI()) }));
}
