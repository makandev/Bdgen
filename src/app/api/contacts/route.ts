import { body, contactInput, fail, handle, json } from "@/lib/api";
import { contacts } from "@/lib/db";

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
