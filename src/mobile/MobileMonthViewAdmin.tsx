import { useMemo, useState } from "react";
import { useAssignments } from "../useAssignments";
import { useEmployees } from "../hooks/useEmployees";
import { useOverrides } from "../useOverrides";
import { isHoliday } from "../calendar/holidays";
import { getShiftModelForStation } from "../shiftModelsDefault";
import { useAbsences } from "../hooks/useAbsences";
import "./MobileMonthView.css";

type Props = {
  stationName: string;
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
};

type SelectedDay = {
  iso: string;
  date: Date;
  day: number;
};

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

export default function MobileMonthViewAdmin({
  stationName,
  year,
  month,
  onMonthChange,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);

  const stationId = stationName;
  const shiftModel = getShiftModelForStation(stationId);

  const { employees } = useEmployees(stationId);
  const safeEmployees = Array.isArray(employees)
    ? employees.filter((employee) => employee.role !== "admin")
    : [];

  const { assignments } = useAssignments(stationId);
  const { absences } = useAbsences(stationId);
  const { overrides } = useOverrides(stationId);
  const selectedDayAbsences =
  selectedDay == null
    ? []
    : absences.filter((absence) => {
        return (
          selectedDay.iso >= absence.start_date &&
          selectedDay.iso <= absence.end_date
        );
      });

  const filteredEmployees = useMemo(() => {
    return safeEmployees.filter((employee) => {
      const employeeName = employee.name ?? "Ohne Namen";
      return employeeName.toLowerCase().includes(search.toLowerCase());
    });
  }, [safeEmployees, search]);

  const weeks = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));

    const result: { days: SelectedDay[] }[] = [];
    const current = new Date(start);

    for (let week = 0; week < 6; week++) {
      const days: SelectedDay[] = [];

      for (let day = 0; day < 7; day++) {
        days.push({
          iso: getLocalISO(current),
          date: new Date(current),
          day: current.getDate(),
        });

        current.setDate(current.getDate() + 1);
      }

      result.push({ days });
    }

    return result;
  }, [year, month]);

  function handlePreviousMonth() {
    setSelectedDay(null);

    if (month === 0) {
      onMonthChange(year - 1, 11);
      return;
    }

    onMonthChange(year, month - 1);
  }

  function handleNextMonth() {
    setSelectedDay(null);

    if (month === 11) {
      onMonthChange(year + 1, 0);
      return;
    }

    onMonthChange(year, month + 1);
  }

  function getShiftsForDay(date: Date, iso: string, holidayName?: string) {
    const overrideShifts = overrides[iso];

    if (overrideShifts && overrideShifts.length > 0) {
      return overrideShifts.map((shift) => ({
        name: shift.name,
        start: shift.start,
        end: shift.end,
        employee: shift.employee ?? null,
        isOverride: true,
      }));
    }

    const jsDay = date.getDay();

    const baseShifts =
      holidayName && shiftModel.holiday.length > 0
        ? shiftModel.holiday
        : jsDay === 0
        ? shiftModel.sunday
        : jsDay === 6
        ? shiftModel.saturday
        : shiftModel.weekdays;

    return baseShifts.map((shift) => ({
      ...shift,
      employee: null,
      isOverride: false,
    }));
  }

  function getEmployeeName(employeeId: string) {
    return (
      safeEmployees.find((employee) => employee.id === employeeId)?.name ??
      "Unbekannt"
    );
  }

  function getDayAssignments(day: SelectedDay) {
    const holiday = isHoliday(day.iso);
    const holidayName = holiday?.name ?? undefined;
    const shifts = getShiftsForDay(day.date, day.iso, holidayName);

    return shifts.map((shift) => {
      const storedShiftName = shift.isOverride
        ? shift.name
        : getStoredShiftName(day.date, shift.name, holidayName);

      const assignmentPeople = assignments
        .filter(
          (assignment) =>
            assignment.date === day.iso &&
            assignment.station_id === stationId &&
            normalizeShiftName(assignment.shift_name) ===
              normalizeShiftName(storedShiftName)
        )
        .map((assignment) => ({
          id: assignment.id,
          employeeName: getEmployeeName(assignment.employee_id),
        }));

      const overridePeople =
        shift.employee && shift.employee.trim() !== ""
          ? [
              {
                id: `${day.iso}-${shift.name}-${shift.employee}`,
                employeeName: shift.employee,
              },
            ]
          : [];

      return {
        shiftName: shift.name,
        start: shift.start,
        end: shift.end,
        assignments: [...assignmentPeople, ...overridePeople],
      };
    });
  }

  const monthNames = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];

  const weekdayNames = [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
  ];

  return (
    <div className="mobile-root">
      <div className="mobile-month-topbar">
        <button
          type="button"
          className="mobile-button small"
          onClick={handlePreviousMonth}
        >
          ←
        </button>

        <h2 className="mobile-month-title">
          {monthNames[month]} {year}
        </h2>

        <button
          type="button"
          className="mobile-button small"
          onClick={handleNextMonth}
        >
          →
        </button>
      </div>

      <input
        type="text"
        placeholder="Mitarbeiter suchen…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mobile-search"
      />

      <div className="mobile-employee-list">
        {filteredEmployees.map((employee) => (
          <span key={employee.id} className="mobile-month-emp-pill">
            {employee.name ?? "Ohne Namen"}
          </span>
        ))}
      </div>

      <div className="mobile-month-header-row">
        <div>Mo</div>
        <div>Di</div>
        <div>Mi</div>
        <div>Do</div>
        <div>Fr</div>
        <div>Sa</div>
        <div>So</div>
      </div>

      <div className="mobile-month-grid">
        {weeks.map((week) =>
          week.days.map((day) => {
            const holiday = isHoliday(day.iso);
            const holidayName = holiday?.name ?? undefined;
            const outside = day.date.getMonth() !== month;

            const compactAssignments = getDayAssignments(day)
              .flatMap((shift) =>
                shift.assignments.map((assignment) => ({
                  id: assignment.id,
                  shiftName: shift.shiftName,
                  employeeName: assignment.employeeName,
                }))
              )
              .slice(0, 3);

            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`
                  mobile-month-cell
                  ${outside ? "mobile-month-outside" : ""}
                  ${holidayName ? "mobile-month-holiday-bg" : ""}
                `}
              >
                <div className="mobile-month-day">{day.day}</div>

                {holidayName && (
                  <div className="mobile-month-holiday">{holidayName}</div>
                )}

                <div className="mobile-month-emp-list">
                  {compactAssignments.map((item) => (
                    <div key={item.id} className="mobile-month-assignment">
                      <strong>{item.shiftName.slice(0, 1)}</strong>
                      <span className="mobile-month-emp-pill">
                        {item.employeeName}
                      </span>
                    </div>
                  ))}

                  {compactAssignments.length === 0 && (
                    <span className="mobile-month-empty-dot">–</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedDay && (
        <div
          className="mobile-day-detail-backdrop"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="mobile-day-detail"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-day-detail-header">
              <div>
                <h3>
                  {weekdayNames[selectedDay.date.getDay()]},{" "}
                  {selectedDay.day}.{selectedDay.date.getMonth() + 1}.
                  {selectedDay.date.getFullYear()}
                </h3>

                {isHoliday(selectedDay.iso)?.name && (
                  <div className="mobile-day-detail-holiday">
                    {isHoliday(selectedDay.iso)?.name}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="mobile-day-detail-close"
                onClick={() => setSelectedDay(null)}
              >
                ×
              </button>
            </div>
{selectedDayAbsences.length > 0 && (
  <div className="mobile-day-detail-absences">
    {selectedDayAbsences.map((absence) => (
      <div
        key={absence.id}
        className={`mobile-absence-item ${absence.type}`}
      >
        <strong>{getEmployeeName(absence.employee_id)}</strong>

        <span>
          {absence.type === "vacation" && "Urlaub"}
          {absence.type === "sick" && "Krank"}
          {absence.type === "unavailable" && "Abwesend"}
        </span>

        {absence.note && (
          <div className="mobile-absence-note">
            {absence.note}
          </div>
        )}
      </div>
    ))}
  </div>
)}
            <div className="mobile-day-detail-shifts">
              {getDayAssignments(selectedDay).map((shift) => (
                <div
                  key={`${selectedDay.iso}-${shift.shiftName}-${shift.start}-${shift.end}`}
                  className="mobile-day-detail-shift"
                >
                  <div className="mobile-day-detail-shift-head">
                    <strong>{shift.shiftName}</strong>
                    <span>
                      {shift.start} – {shift.end}
                    </span>
                  </div>

                  {shift.assignments.length === 0 ? (
                    <div className="mobile-day-detail-empty">Nicht besetzt</div>
                  ) : (
                    <div className="mobile-day-detail-people">
                      {shift.assignments.map((assignment) => (
                        <span
                          key={assignment.id}
                          className="mobile-day-detail-person"
                        >
                          {assignment.employeeName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}