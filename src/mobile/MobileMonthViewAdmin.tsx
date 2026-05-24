import { useMemo, useState } from "react";
import { useAssignments } from "../useAssignments";
import { useEmployees } from "../hooks/useEmployees";
import { isHoliday } from "../calendar/holidays";
import { getShiftModelForStation } from "../shiftModelsDefault";
import "./MobileMonthView.css";

type Props = {
  stationName: string;
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

function getStoredShiftName(date: Date, shiftName: string, holidayName?: string) {
  const jsDay = date.getDay();

  if (holidayName) return `Feiertag ${shiftName}`;
  if (jsDay === 0) return `Sonntag ${shiftName}`;
  if (jsDay === 6) return `Samstag ${shiftName}`;

  return shiftName;
}

export default function MobileMonthViewAdmin({ stationName }: Props) {
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);

  const stationId = stationName;
  const shiftModel = getShiftModelForStation(stationId);

  const { employees } = useEmployees(stationId);
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const { assignments } = useAssignments(stationId);

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
    setMonth((currentMonth) => {
      if (currentMonth === 0) {
        setYear((currentYear) => currentYear - 1);
        return 11;
      }

      return currentMonth - 1;
    });
  }

  function handleNextMonth() {
    setSelectedDay(null);
    setMonth((currentMonth) => {
      if (currentMonth === 11) {
        setYear((currentYear) => currentYear + 1);
        return 0;
      }

      return currentMonth + 1;
    });
  }

  function getShiftsForDay(date: Date, holidayName?: string) {
    const jsDay = date.getDay();

    if (holidayName && shiftModel.holiday.length > 0) return shiftModel.holiday;
    if (jsDay === 0) return shiftModel.sunday;
    if (jsDay === 6) return shiftModel.saturday;

    return shiftModel.weekdays;
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
    const shifts = getShiftsForDay(day.date, holidayName);

    return shifts.map((shift) => {
      const storedShiftName = getStoredShiftName(
        day.date,
        shift.name,
        holidayName
      );

      const shiftAssignments = assignments
        .filter(
          (assignment) =>
            assignment.date === day.iso &&
            assignment.shift_name === storedShiftName &&
            assignment.station_id === stationId
        )
        .map((assignment) => ({
          id: assignment.id,
          employeeName: getEmployeeName(assignment.employee_id),
        }));

      return {
        shiftName: shift.name,
        start: shift.start,
        end: shift.end,
        assignments: shiftAssignments,
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

            <div className="mobile-day-detail-shifts">
              {getDayAssignments(selectedDay).map((shift) => (
                <div
                  key={`${selectedDay.iso}-${shift.shiftName}`}
                  className="mobile-day-detail-shift"
                >
                  <div className="mobile-day-detail-shift-head">
                    <strong>{shift.shiftName}</strong>
                    <span>
                      {shift.start} – {shift.end}
                    </span>
                  </div>

                  {shift.assignments.length === 0 ? (
                    <div className="mobile-day-detail-empty">
                      Nicht besetzt
                    </div>
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