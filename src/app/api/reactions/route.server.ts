import { reactions } from "@/server/db";
import { handle, json } from "@/server/http";

export function GET() {
  return handle(() => json({ reactions: reactions.recent(20) }));
}
