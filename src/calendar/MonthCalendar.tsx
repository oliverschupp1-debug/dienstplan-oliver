import React, { useState, useMemo, useEffect } from "react";
import { generateCalendar } from "./calendarUtils";
import OverridePanel from "../components/OverridePanel";
import { getShiftModelForStation } from "../shiftModelsDefault";
import { useOverrides } from "../useOverrides";
import { supabase } from "../lib/supabaseClient";
import { assignmentsChanged, onAssignmentsChanged } from "../events";
import "./MonthCalendar.css";

type Props = {
  stationName: string;
  onMonthChange?: (year: number, month: number) => void;
};

const ORDER = ["Früh", "Früh 2", "Mittel", "Spät"];

function mapShiftNameForStorage(day: any, shiftName: string) {
  if (day.isHoliday) return `Feiertag ${shiftName}`;
  if (day.weekday === 6) return `Sonntag ${shiftName}`;
  if (day.weekday === 5) return `Samstag ${shiftName}`;
  return shiftName;
}

export default function MonthCalendar({ stationName, onMonthChange }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    onMonthChange?.(year, month);
  }, [year, month, onMonthChange]);

  const safeStation = (stationName ?? "lindenberg").toLowerCase();

  const { overrides, reload: reloadOverrides } = useOverrides(
    safeStation,
    year,
    month
  );

  const model = getShiftModelForStation(safeStation);
  const calendar = generateCalendar(year, month);

  const monthNames = [
    "Januar","Februar","März","April","Mai","Juni",
    "Juli","August","September","Oktober","November","Dezember"
  ];

  function prevMonth() {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function nextMonth() {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  function openOverride(dateIso: string) {
    setSelectedDate(dateIso);
  }

  function getShiftsForDay(day: any) {
    const base =
      day.isHoliday
        ? model.holiday
        : day.weekday === 6
        ? model.sunday
        : day.weekday === 5
        ? model.saturday
        : model.weekdays;

    const dateOverrides = overrides[day.iso] || [];

    const merged = base.map((shift: any) => {
      const ov = dateOverrides.find((o: any) => o.name === shift.name);
      return ov
        ? { ...shift, start: ov.start_time, end: ov.end_time, _override: true, id: ov.id }
        : shift;
    });

    dateOverrides.forEach((ov: any) => {
      if (!merged.some((s: any) => s.name === ov.name)) {
        merged.push({
          name: ov.name,
          start: ov.start_time,
          end: ov.end_time,
          _override: true,
          id: ov.id
        });
      }
    });

    merged.sort((a: any, b: any) => {
      const ia = ORDER.indexOf(a.name);
      const ib = ORDER.indexOf(b.name);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return merged;
  }

  function shiftNameToCssKey(name: string) {
    return name
      .toLowerCase()
      .replace("ü", "ue")
      .replace("ä", "ae")
      .replace("ö", "oe")
      .replace("ß", "ss")
      .replace(/\s+/g, "");
  }

  const maxShifts = useMemo(() => {
    let max = 0;
    for (const week of calendar) {
      for (const day of week.days) {
        const shifts = getShiftsForDay(day);
        if (shifts.length > max) max = shifts.length;
      }
    }
    return max;
  }, [calendar, overrides]);

  async function assignEmployee(
    dateIso: string,
    shiftName: string,
    employeeId: string,
    day: any,
    shift: any
  ) {
    const mappedName = mapShiftNameForStorage(day, shiftName);

    await supabase.from("assignments").insert({
      station_id: safeStation,
      date: dateIso.split("T")[0],
      shift_name: mappedName,
      employee_id: employeeId,
      override_start_time: shift._override ? shift.start : null,
      override_end_time: shift._override ? shift.end : null,
    });

    assignmentsChanged();
  }

  async function deleteShiftForDay(
    dateIso: string,
    shiftName: string,
    day: any,
    shift: any
  ) {
    const date = dateIso.split("T")[0];

    if (shift._override) {
      await supabase.from("override_shifts").delete().eq("id", shift.id);

      await supabase
        .from("assignments")
        .delete()
        .eq("date", date)
        .eq("shift_name", mapShiftNameForStorage(day, shiftName));

      assignmentsChanged();
      return;
    }

    const { data: dayOverride } = await supabase
      .from("day_overrides")
      .upsert({
        station_id: safeStation,
        date: date,
        note: ""
      })
      .select()
      .single();

    const overrideId = dayOverride.id;

    const baseShifts = getShiftsForDay(day).filter((s) => s.name !== shiftName);

    await supabase.from("override_shifts").delete().eq("override_id", overrideId);

    const rows = baseShifts.map((s) => ({
      override_id: overrideId,
      name: s.name,
      start_time: s.start,
      end_time: s.end
    }));

    if (rows.length > 0) {
      await supabase.from("override_shifts").insert(rows);
    }

    await supabase
      .from("assignments")
      .delete()
      .eq("date", date)
      .eq("shift_name", mapShiftNameForStorage(day, shiftName));

    assignmentsChanged();
  }

  async function removeEmployee(assignmentId: string) {
    await supabase.from("assignments").delete().eq("id", assignmentId);
    assignmentsChanged();
  }

  return (
    <div className="month-root-dark">
      <div className="calendar-header-dark">
        <div className="calendar-header-left">
          <button onClick={prevMonth}>◀</button>
          <h2>
            {monthNames[month]} {year}
          </h2>
          <button onClick={nextMonth}>▶</button>
        </div>

        <div className="calendar-header-right">DIENSTPLAN</div>
      </div>

      <div className="calendar-weekdays-dark">
        <div>KW</div>
        <div>Mo</div>
        <div>Di</div>
        <div>Mi</div>
        <div>Do</div>
        <div>Fr</div>
        <div>Sa</div>
        <div>So</div>
      </div>

      <div className="calendar-grid-dark">
        {calendar.map((week: any, wi: number) => (
          <React.Fragment key={wi}>
            <div className="calendar-weeknumber-dark">{week.weekNumber}</div>

            {week.days.map((day: any) => {
              const iso = day.iso;
              const shifts = getShiftsForDay(day);

              return (
                <div
                  key={iso}
                  className={
                    "calendar-cell-dark " +
                    (day.outside ? "outside-month-dark" : "")
                  }
                  style={{ minHeight: `${70 + maxShifts * 60}px` }}
                  onDoubleClick={() => openOverride(iso)}
                >
                  <div className="calendar-date-row-dark">
                    <div className="calendar-date-dark">{day.day}</div>
                    {day.holidayName && (
                      <div className="holiday-badge-dark">
                        {day.holidayName}
                      </div>
                    )}
                  </div>

                  <div className="shift-list-dark">
                    {shifts.map((shift: any) => {
                      const cssKey = shiftNameToCssKey(shift.name);

                      return (
                        <div
                          key={shift.name + shift.start + shift.end}
                          className={
                            "shift-row-dark " +
                            `shift-${cssKey}` +
                            (shift._override ? " override-dark" : "")
                          }
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            const employeeId =
                              e.dataTransfer.getData("employeeId");
                            if (employeeId)
                              assignEmployee(
                                iso,
                                shift.name,
                                employeeId,
                                day,
                                shift
                              );
                          }}
                        >
                          <div className="shift-header-dark">
                            <div className="shift-name-dark">{shift.name}</div>
                            <div className="shift-time-dark">
                              {shift.start} – {shift.end}
                            </div>

                            <button
                              className="shift-delete-btn"
                              onClick={() =>
                                deleteShiftForDay(
                                  iso,
                                  shift.name,
                                  day,
                                  shift
                                )
                              }
                            >
                              ✕
                            </button>
                          </div>

                          <ShiftEmployees
                            dateIso={iso}
                            shiftName={mapShiftNameForStorage(
                              day,
                              shift.name
                            )}
                            station={safeStation}
                            onRemove={removeEmployee}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {selectedDate && (
        <OverridePanel
          date={selectedDate}
          stationName={safeStation}
          onClose={() => {
            reloadOverrides();
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}

function ShiftEmployees({
  dateIso,
  shiftName,
  station,
  onRemove,
}: {
  dateIso: string;
  shiftName: string;
  station: string;
  onRemove: (id: string) => void;
}) {
  const [items, setItems] = React.useState<any[]>([]);

  function normalizeDate(iso: string) {
    return iso.split("T")[0];
  }

  async function load() {
    const normalized = normalizeDate(dateIso);

    const { data, error } = await supabase
      .from("assignments")
      .select(
        `
        id,
        employee_id,
        assignments_employee_id_fkey:employee_id (
          name
        )
      `
      )
      .eq("station_id", station)
      .eq("date", normalized)
      .eq("shift_name", shiftName);

    if (error) console.error(error);

    setItems(data ?? []);
  }

  useEffect(() => {
    load();
    const off = onAssignmentsChanged(() => load());
    return () => off();
  }, [dateIso, shiftName, station]);

  return (
    <div className="shift-employees-dark">
      {items.map((a) => (
        <div key={a.id} className="shift-employee-item-dark">
          <div className="shift-employee-avatar-dark">
            {a.assignments_employee_id_fkey?.name
              ?.charAt(0)
              ?.toUpperCase()}
          </div>
          <div className="shift-employee-name-dark">
            {a.assignments_employee_id_fkey?.name}
          </div>

          <button
            className="shift-employee-remove-dark"
            onClick={() => onRemove(a.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
