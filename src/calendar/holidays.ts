// holidays.ts
// Feiertage NRW – komplett UTC-sicher, ohne Date-Verschiebungen
// Optimiert mit Jahres-Cache für maximale Performance

export type HolidayInfo = {
  name: string | null;
};

// -------------------------------------------------------------
// Hilfsfunktion: ISO-String erzeugen ("YYYY-MM-DD")
// -------------------------------------------------------------
function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// -------------------------------------------------------------
// Ostersonntag berechnen (Meeus/Jones/Butcher)
// -------------------------------------------------------------
function getEasterSundayISO(year: number): string {
  const f = Math.floor;
  const a = year % 19;
  const b = f(year / 100);
  const c = year % 100;
  const d = f(b / 4);
  const e = b % 4;
  const g = f((8 * b + 13) / 25);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = f(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = f((a + 11 * h + 22 * l) / 451);
  const month = f((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return iso(year, month, day);
}

// -------------------------------------------------------------
// ISO-Datum + Tage addieren (UTC-sicher)
// -------------------------------------------------------------
function addDaysISO(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  return iso(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate());
}

// -------------------------------------------------------------
// Jahres-Cache (massive Performance-Verbesserung!)
// -------------------------------------------------------------
const holidayCache: Record<number, Record<string, string>> = {};

// -------------------------------------------------------------
// Feiertage NRW für ein bestimmtes Jahr berechnen
// -------------------------------------------------------------
export function getHolidaysForYear(year: number): Record<string, string> {
  if (holidayCache[year]) return holidayCache[year];

  const easter = getEasterSundayISO(year);
  const holidays: Record<string, string> = {};

  function add(dateISO: string, name: string) {
    holidays[dateISO] = name;
  }

  // Feste Feiertage
  add(iso(year, 1, 1), "Neujahr");
  add(iso(year, 5, 1), "Tag der Arbeit");
  add(iso(year, 10, 3), "Tag der Deutschen Einheit");
  add(iso(year, 12, 25), "1. Weihnachtstag");
  add(iso(year, 12, 26), "2. Weihnachtstag");

  // Bewegliche Feiertage
  add(addDaysISO(easter, -2), "Karfreitag");
  add(addDaysISO(easter, 1), "Ostermontag");
  add(addDaysISO(easter, 39), "Christi Himmelfahrt");
  add(addDaysISO(easter, 50), "Pfingstmontag");
  add(addDaysISO(easter, 60), "Fronleichnam");

  holidayCache[year] = holidays;
  return holidays;
}

// -------------------------------------------------------------
// Hauptfunktion: Feiertag für ein Datum zurückgeben
// -------------------------------------------------------------
export function getHoliday(date: Date): HolidayInfo {
  const isoDate = iso(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  const holidays = getHolidaysForYear(date.getFullYear());

  return {
    name: holidays[isoDate] ?? null
  };
}

// -------------------------------------------------------------
// Wrapper: Prüfen, ob ein ISO-Datum ein Feiertag ist
// -------------------------------------------------------------
export function isHoliday(isoDate: string): {
  holiday: boolean;
  name: string | null;
} {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  const info = getHoliday(date);

  return {
    holiday: info.name !== null,
    name: info.name
  };
}

// -------------------------------------------------------------
// Mobile-Hilfsfunktion: Feiertag direkt per ISO abrufen
// -------------------------------------------------------------
export function getHolidayInfo(isoDate: string): { name: string | null } {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return getHoliday(date);
}
