import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { useAssignments } from "../useAssignments";
import { useEmployees } from "../hooks/useEmployees";
import { useOverrides } from "../useOverrides";
import { isHoliday } from "../calendar/holidays";
import { getShiftModelForStation } from "../shiftModelsDefault";
import { supabase } from "../lib/supabaseClient";
import "./StationMonitorView.css";

function getLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeShiftName(name: string) {
  return name
    .replace(/^Feiertag\s+/i, "")
    .replace(/^Samstag\s+/i, "")
    .replace(/^Sonntag\s+/i, "")
    .trim();
}

function getStoredShiftName(date: Date, shiftName: string, holidayName?: string) {
  const jsDay = date.getDay();

  if (holidayName) return `Feiertag ${shiftName}`;
  if (jsDay === 0) return `Sonntag ${shiftName}`;
  if (jsDay === 6) return `Samstag ${shiftName}`;

  return shiftName;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getWeekMonday(date: Date) {
  const monday = new Date(date);
  const diff = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - diff);
  return monday;
}

export default function StationMonitorView() {
  const storedStationId = useAppStore((s) => s.stationId);
const userName = useAppStore((s) => s.userName);
const [searchParams] = useSearchParams();

const stationId = searchParams.get("station") ?? storedStationId;

  const [now, setNow] = useState(() => new Date());
  const iso = getLocalISO(now);

  const { assignments, reload } = useAssignments(stationId ?? "");
  const { employees } = useEmployees(stationId ?? null);
  const { overrides } = useOverrides(stationId ?? "");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
      reload();
    }, 60_000);
    useEffect(() => {
  if (!stationId) return;

  const channel = supabase
    .channel(`monitor-sync-${stationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "assignments",
        filter: `station_id=eq.${stationId}`,
      },
      () => {
        reload();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "day_overrides",
        filter: `station_id=eq.${stationId}`,
      },
      () => {
        reload();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "employee_absences",
        filter: `station_id=eq.${stationId}`,
      },
      () => {
        reload();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [stationId, reload]);

    return () => window.clearInterval(timer);
  }, [reload]);

  const model = getShiftModelForStation(stationId ?? "");

  function getEmployeeName(employeeId: string) {
    return (
      employees.find((employee) => employee.id === employeeId)?.name ??
      "Unbekannt"
    );
  }

  function getShiftsForDate(date: Date) {
    const dayIso = getLocalISO(date);
    const holiday = isHoliday(dayIso);
    const holidayName = holiday?.name ?? undefined;
    const weekdayIndex = (date.getDay() + 6) % 7;
    const overrideShifts = overrides[dayIso];

    if (overrideShifts && overrideShifts.length > 0) {
      return overrideShifts.map((shift) => ({
        name: shift.name,
        start: shift.start,
        end: shift.end,
        employee: shift.employee ?? null,
        isOverride: true,
        holidayName,
      }));
    }

    const baseShifts =
      holidayName && model.holiday.length > 0
        ? model.holiday
        : weekdayIndex === 6
        ? model.sunday
        : weekdayIndex === 5
        ? model.saturday
        : model.weekdays;

    return baseShifts.map((shift) => ({
      ...shift,
      employee: null,
      isOverride: false,
      holidayName,
    }));
  }

  function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getShiftStatus(start: string, end: string, now: Date) {
  const current = now.getHours() * 60 + now.getMinutes();
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  if (current >= startMin && current <= endMin) return "active";
  if (current < startMin) return "next";
  return "past";
}

function getPeopleForShift(
  date: Date,
  shift: ReturnType<typeof getShiftsForDate>[number]
) {
  const dayIso = getLocalISO(date);

  const storedShiftName = shift.isOverride
    ? shift.name
    : getStoredShiftName(date, shift.name, shift.holidayName);

    const assignmentPeople = assignments
      .filter(
        (assignment) =>
          assignment.date === dayIso &&
          assignment.station_id === stationId &&
          normalizeShiftName(assignment.shift_name) ===
            normalizeShiftName(storedShiftName)
      )
      .map((assignment) => getEmployeeName(assignment.employee_id));

    const overridePeople =
      shift.employee && shift.employee.trim() !== "" ? [shift.employee] : [];

    return [...assignmentPeople, ...overridePeople];
  }

  const todayShifts = useMemo(() => getShiftsForDate(now), [now, overrides, model, assignments]);

  const weekDays = useMemo(() => {
    const monday = getWeekMonday(now);

    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(monday, index);
      return {
        date,
        iso: getLocalISO(date),
      };
    });
  }, [now]);

  const holiday = isHoliday(iso);
  const holidayName = holiday?.name ?? undefined;
  const weekdayIndex = (now.getDay() + 6) % 7;

  const weekdayNames = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
  ];

  const shortWeekdayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  if (!stationId) {
    return (
      <div className="monitor-root">
        <div className="monitor-empty">Keine Station ausgewählt.</div>
      </div>
    );
  }

  return (
    <div className="monitor-root">
      <header className="monitor-header">
        <div>
          <div className="monitor-kicker">Stationsmonitor</div>
          <h1>{stationId.charAt(0).toUpperCase() + stationId.slice(1)}</h1>
        </div>

        <div className="monitor-date">
          <strong>
            {weekdayNames[weekdayIndex]}, {now.getDate()}.{now.getMonth() + 1}.
            {now.getFullYear()}
          </strong>
          <span>
            {now.toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </header>

      {holidayName && <div className="monitor-holiday">{holidayName}</div>}

      <main className="monitor-shifts">
        {todayShifts.map((shift) => {
          const people = getPeopleForShift(now, shift);
          const status = getShiftStatus(shift.start, shift.end, now);

          if (people.length === 0) return null;

          return (
            <section
              key={`${iso}-${shift.name}-${shift.start}-${shift.end}`}
              className={`monitor-shift-card monitor-shift-${status}`}
            >
              <div className="monitor-shift-head">
                <h2>{shift.name}</h2>
                <span>
                  {shift.start} – {shift.end}
                </span>
              </div>

              <div className="monitor-people">
                {people.map((name, index) => (
                  <div key={`${name}-${index}`} className="monitor-person">
                    {name}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <section className="monitor-week">
        <h2>Diese Woche</h2>

        <div className="monitor-week-grid">
          {weekDays.map((day, dayIndex) => {
            const dayHoliday = isHoliday(day.iso);
            const dayShifts = getShiftsForDate(day.date)
              .map((shift) => ({
                shift,
                people: getPeopleForShift(day.date, shift),
              }))
              .filter((entry) => entry.people.length > 0);

            const isToday = day.iso === iso;

            return (
              <div
                key={day.iso}
                className={
                  "monitor-week-day" + (isToday ? " monitor-week-today" : "")
                }
              >
                <div className="monitor-week-day-head">
                  <strong>{shortWeekdayNames[dayIndex]}</strong>
                  <span>
                    {day.date.getDate()}.{day.date.getMonth() + 1}.
                  </span>
                </div>

                {dayHoliday?.name && (
                  <div className="monitor-week-holiday">{dayHoliday.name}</div>
                )}

                <div className="monitor-week-shifts">
                  {dayShifts.length === 0 ? (
                    <div className="monitor-week-empty">–</div>
                  ) : (
                    dayShifts.map(({ shift, people }) => (
                      <div
                        key={`${day.iso}-${shift.name}-${shift.start}-${shift.end}`}
                        className="monitor-week-shift"
                      >
                        <div className="monitor-week-shift-name">
                          {shift.name}
                        </div>

                        <div className="monitor-week-people">
                          {people.join(", ")}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="monitor-footer">
        Angemeldet als {userName || "Benutzer"} · Aktualisierung automatisch jede
        Minute
      </footer>
    </div>
  );
}