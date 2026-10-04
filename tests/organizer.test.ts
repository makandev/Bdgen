import { test } from "node:test";
import assert from "node:assert/strict";
import { entries, foldLine, icsText, reminderText, toICS, yearsLabel } from "../src/lib/organizer";
import { contactInput } from "../src/lib/records";
import type { Contact } from "../src/lib/types";

const base: Contact = {
  id: "c1", name: "Oma Gisela", relation: "Oma", address: "du", occasion: "geburtstag", date: "1956-10-07",
  events: [{ label: "Hochzeitstag", date: "1978-06-02" }, { label: "Namenstag", date: "1904-11-19" }],
  mood: [], notes: "", createdAt: "", updatedAt: "",
};
const today = new Date(2026, 9, 4); // 4 Oct 2026

test("organizer: all dates of a person, soonest first, with age and countdown", () => {
  const list = entries([base], today);
  assert.deepEqual(list.map((e) => [e.label, e.days]), [["Geburtstag", 3], ["Namenstag", 46], ["Hochzeitstag", 241]]);
  assert.equal(yearsLabel(list[0]), "wird 70");
  assert.equal(reminderText(list[0]), "Oma Gisela hat in 3 Tagen Geburtstag (wird 70)!");
  assert.equal(yearsLabel(list[2]), "49. Hochzeitstag");
  assert.equal(list[1].years, null, "1904 means: year unknown");
  assert.equal(entries([{ ...base, date: "2000-10-04", events: [] }], today)[0].days, 0);
});

test("organizer: contact input keeps valid extra dates only", () => {
  const r = contactInput({ name: "A", events: [{ label: "Hochzeitstag", date: "2001-05-05" }, { label: "", date: "2001-05-05" }, { label: "X", date: "kaputt" }, "nix"] });
  assert.ok(typeof r !== "string");
  assert.deepEqual(r.events, [{ label: "Hochzeitstag", date: "2001-05-05" }]);
  assert.deepEqual((contactInput({ name: "B" }) as Contact).events, []);
});

test("calendar export: yearly events, reminders, no injection through names", () => {
  const evil = { ...base, name: "Eve\r\nEND:VEVENT\r\nBEGIN:VEVENT;x,y\\", events: [] };
  const ics = toICS(entries([evil, { ...base, id: "c2", date: "2000-02-29", events: [] }], today), 3, today);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal(ics.match(/^BEGIN:VEVENT$/gm)?.length, 2, "a name can never open a new event");
  assert.match(ics, /DTSTART;VALUE=DATE:20261007/);
  assert.match(ics, /RRULE:FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1/);
  assert.match(ics, /TRIGGER:-PT63H/);
  assert.equal(icsText("a;b,c\\d\ne"), "a\\;b\\,c\\\\d e");
  for (const line of ics.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, line);
  assert.equal(foldLine("🎂".repeat(30)).split("\r\n ").join(""), "🎂".repeat(30));
});
