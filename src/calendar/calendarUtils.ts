// -------------------------------------------------------------
// Feiertage + Kalender-Utils
// -------------------------------------------------------------

export type CalendarDay = {
  iso: string;
  day: number;
  weekday: number; // 0=Mo ... 6=So
  outside: boolean;
  isHoliday: boolean;
  holidayName: string | null;
};

export type CalendarWeek = {
  weekNumber: number;
  days: CalendarDay[];
};

// -------------------------------------------------------------
// Lokale ISO-Funktion (KEIN UTC, KEIN Tagesversatz)
// -------------------------------------------------------------
function toIsoLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// -------------------------------------------------------------
// Osterformel (Gauss) → Basis für alle beweglichen Feiertage
// -------------------------------------------------------------
function getEasterSunday(year: number): Date {
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
  const day = 1 + ((h + l - 7 * m + 114) % 31);
  return new Date(year, month - 1, day);
}

// -------------------------------------------------------------
// Bewegliche Feiertage (NRW)
// -------------------------------------------------------------
function getMoveableHolidays(year: number): Record<string, string> {
  const easter = getEasterSunday(year);

  function addDays(base: Date, days: number): string {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return toIsoLocal(d).slice(5, 10); // "MM-DD"
  }

  return {
    [addDays(easter, -2)]: "Karfreitag",
    [addDays(easter, 0)]: "Ostersonntag",
    [addDays(easter, 1)]: "Ostermontag",
    [addDays(easter, 39)]: "Christi Himmelfahrt",
    [addDays(easter, 49)]: "Pfingstsonntag",
    [addDays(easter, 50)]: "Pfingstmontag",
    [addDays(easter, 60)]: "Fronleichnam"
  };
}

// -------------------------------------------------------------
// Feste Feiertage (NRW)
// -------------------------------------------------------------
const FIXED_HOLIDAYS: Record<string, string> = {
  "01-01": "Neujahr",
  "05-01": "Tag der Arbeit",
  "10-03": "Tag der Deutschen Einheit",
  "11-01": "Allerheiligen",
  "12-25": "1. Weihnachtstag",
  "12-26": "2. Weihnachtstag"
};

// -------------------------------------------------------------
// Feiertag prüfen
// -------------------------------------------------------------
function getHoliday(date: Date): { isHoliday: boolean; name: string | null } {
  const year = date.getFullYear();
  const mmdd = toIsoLocal(date).slice(5, 10);

  const moveable = getMoveableHolidays(year);

  if (FIXED_HOLIDAYS[mmdd]) {
    return { isHoliday: true, name: FIXED_HOLIDAYS[mmdd] };
  }
  if (moveable[mmdd]) {
    return { isHoliday: true, name: moveable[mmdd] };
  }

  return { isHoliday: false, name: null };
}

// -------------------------------------------------------------
// ISO-Kalenderwoche
// -------------------------------------------------------------
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// -------------------------------------------------------------
// Kalender generieren (mit lokalem ISO, kein UTC)
// -------------------------------------------------------------
export function generateCalendar(year: number, month: number): CalendarWeek[] {
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const weeks: CalendarWeek[] = [];

  let current = new Date(year, month, 1 - startWeekday);

  for (let w = 0; w < 6; w++) {
    const days: CalendarDay[] = [];

    for (let d = 0; d < 7; d++) {
      const inMonth = current.getMonth() === month;
      const { isHoliday, name } = getHoliday(current);

      days.push({
        iso: toIsoLocal(current), // ← FIXED: kein UTC mehr
        day: current.getDate(),
        weekday: (current.getDay() + 6) % 7,
        outside: !inMonth,
        isHoliday,
        holidayName: name
      });

      current.setDate(current.getDate() + 1);
    }

    weeks.push({
      weekNumber: getWeekNumber(new Date(days[0].iso)),
      days
    });
  }

  return weeks;
}
