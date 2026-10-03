import { contactInput } from "@/lib/records";
import { contacts } from "@/server/db";
import { body, fail, handle, json } from "@/server/http";

export function GET() {
  return handle(() => json({ contacts: contacts.list() }));
}

export function POST(req: Request) {
  return handle(async () => {
    const input = contactInput(await body(req));
    if (typeof input === "string") return fail(input);
    return json({ contact: contacts.create(input) }, 201);
  });
}
