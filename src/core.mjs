export const ACTIVITIES = Object.freeze({
  drive: 'Guida', work: 'Altri lavori', available: 'Disponibilità', rest: 'Pausa / riposo'
});
export function asDate(value) {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error('Data o ora non valida');
  return d;
}
export function validateActivity(activity, existing = []) {
  if (!Object.hasOwn(ACTIVITIES, activity.type)) throw new Error('Tipo di attività non valido');
  const start = asDate(activity.start).getTime();
  const end = asDate(activity.end).getTime();
  if (end <= start) throw new Error('La fine deve essere successiva all’inizio');
  if (end - start > 1000 * 60 * 60 * 24 * 14) throw new Error('Un’attività non può superare 14 giorni');
  if (start > Date.now() + 5 * 60 * 1000) throw new Error('Non si possono registrare attività future');
  if (existing.some(x => x.id !== activity.id && start < new Date(x.end).getTime() && end > new Date(x.start).getTime())) {
    throw new Error('Intervallo sovrapposto a un’attività già salvata');
  }
  return { ...activity, start: new Date(start).toISOString(), end: new Date(end).toISOString() };
}
export function startOfDay(value) { const d = asDate(value); d.setHours(0,0,0,0); return d; }
export function addDays(value, n) { const d = startOfDay(value); d.setDate(d.getDate()+n); return d; }
export function weekStart(value) { const d = startOfDay(value); d.setDate(d.getDate() - ((d.getDay()+6)%7)); return d; }
export function dayKey(value) {
  const d=asDate(value);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
// Calendar days are explicitly different from the legally defined daily driving period.
export function durationByActivity(records, periodStart, periodEnd) {
  const start = asDate(periodStart).getTime(), end = asDate(periodEnd).getTime();
  const total = { drive:0, work:0, available:0, rest:0 };
  for (const rec of records) {
    if (!Object.hasOwn(total, rec.type)) continue;
    const a = Math.max(start, asDate(rec.start).getTime());
    const b = Math.min(end, asDate(rec.end).getTime());
    if (b > a) total[rec.type] += (b-a) / 60000;
  }
  return total;
}
export function getTotals(records, dateValue) {
  const day = startOfDay(dateValue), tomorrow = addDays(day,1);
  const monday = weekStart(day), mondayNext = addDays(monday,7), mondayPrev=addDays(monday,-7);
  return {
    day: durationByActivity(records,day,tomorrow),
    week: durationByActivity(records,monday,mondayNext),
    fortnight: durationByActivity(records,mondayPrev,mondayNext)
  };
}
export function fmtMinutes(n) {
  const rounded=Math.max(0, Math.round(n)); return `${Math.floor(rounded/60)}h ${String(rounded%60).padStart(2,'0')}m`;
}
export function localDatetimeString(value) {
  const d=asDate(value);
  return `${dayKey(d)}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
export function fromLocalInput(value) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value)) throw new Error('Orario non valido');
  const d = new Date(value);
  if (Number.isNaN(d.getTime()) || localDatetimeString(d) !== value) throw new Error('Orario locale inesistente (cambio ora)');
  return d.toISOString();
}
export function compareByStart(a,b) { return a.start.localeCompare(b.start); }
