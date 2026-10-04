import { normalizeBackup } from "@/lib/records";
import { exportBackup, importBackup } from "@/server/db";
import { BACKUP_MAX_BYTES } from "@/lib/uploads";
import { body, handle, json } from "@/server/http";

export function GET() {
  return handle(() => json(exportBackup()));
}

export function POST(req: Request) {
  return handle(async () => {
    const n = normalizeBackup(await body(req, BACKUP_MAX_BYTES));
    importBackup(n);
    return json({ contacts: n.contacts.length, cards: n.cards.length });
  });
}
