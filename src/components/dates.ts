/** Days until the next yearly occurrence of an ISO date (YYYY-MM-DD), or null. */
export function daysUntil(iso: string, today = new Date()): number | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(today.getFullYear(), Number(m[2]) - 1, Number(m[3]));
  if (next < start) next = new Date(today.getFullYear() + 1, Number(m[2]) - 1, Number(m[3]));
  return Math.round((next.getTime() - start.getTime()) / 864e5);
}

export function dateLabel(iso: string): string {
  const d = daysUntil(iso);
  if (d === null) return "";
  const m = iso.match(/^\d{4}-(\d{2})-(\d{2})$/)!;
  const day = `${m[2]}.${m[1]}.`;
  if (d === 0) return `${day} · heute!`;
  if (d === 1) return `${day} · morgen`;
  if (d <= 60) return `${day} · in ${d} Tagen`;
  return day;
}
