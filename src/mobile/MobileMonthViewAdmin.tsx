import { useMemo, useState } from "react";
import { useAssignments } from "../useAssignments";
import { useEmployees } from "../hooks/useEmployees";
import { isHoliday } from "../calendar/holidays";
import { getShiftModelForStation } from "../shiftModelsDefault";
import { useTouchNavigation } from "../useTouchNavigation";

interface Props {
  stationName: string;
}

export default function MobileMonthViewAdmin({ stationName }: Props) {
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [search, setSearch] = useState("");
  const [dragEmployee, setDragEmployee] = useState<string | null>(null);

  const stationId = stationName;
  const shiftModel = getShiftModelForStation(stationId);

  const { employees } = useEmployees(stationId);
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const { assignments, addAssignment, removeAssignment } =
    useAssignments(stationId);

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

    const result: { days: any[] }[] = [];
    const current = new Date(start);

    for (let week = 0; week < 6; week++) {
      const days: any[] = [];

      for (let day = 0; day < 7; day++) {
        const iso = current.toISOString().split("T")[0];

        days.push({
          iso,
          date: new Date(current),
          day: current.getDate(),
          outside: current.getMonth() !== month,
        });

        current.setDate(current.getDate() + 1);
      }

      result.push({ days });
    }

    return result;
  }, [year, month]);

  useTouchNavigation({
    onSwipeLeft: () =>
      setMonth((currentMonth) => {
        if (currentMonth === 11) {
          setYear((currentYear) => currentYear + 1);
          return 0;
        }

        return currentMonth + 1;
      }),
    onSwipeRight: () =>
      setMonth((currentMonth) => {
        if (currentMonth === 0) {
          setYear((currentYear) => currentYear - 1);
          return 11;
        }

        return currentMonth - 1;
      }),
    onSwipeUp: () => window.scrollBy({ top: 300, behavior: "smooth" }),
    onSwipeDown: () => window.scrollBy({ top: -300, behavior: "smooth" }),
  });

  function handleDragStart(employeeId: string) {
    setDragEmployee(employeeId);
  }

  function handleDragEnd() {
    setDragEmployee(null);
  }

  function handleDrop(iso: string, shiftName: string) {
    if (!dragEmployee) return;

    const existing = assignments.find(
      (assignment) =>
        assignment.date === iso &&
        assignment.shift_name === shiftName &&
        assignment.station_id === stationId
    );

    if (existing) {
      removeAssignment(existing.id);
    }

    addAssignment({
      date: iso,
      shift_name: shiftName,
      employee_id: dragEmployee,
      station_id: stationId,
    });

    setDragEmployee(null);
  }

  function getShiftsForDay(day: any) {
    const holiday = isHoliday(day.iso);
    const weekdayIndex = (day.date.getDay() + 6) % 7;

    if (holiday?.name) return shiftModel.holiday;
    if (weekdayIndex === 6) return shiftModel.sunday;
    if (weekdayIndex === 5) return shiftModel.saturday;

    return shiftModel.weekdays;
  }

  function getEmployeeName(employeeId: string) {
    return (
      safeEmployees.find((employee) => employee.id === employeeId)?.name ??
      "Unbekannt"
    );
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

  return (
    <div className="mobile-root">
      <h2 className="mobile-month-title">
        {monthNames[month]} {year}
      </h2>

      <input
        type="text"
        placeholder="Mitarbeiter suchen…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mobile-search"
      />

      <div className="mobile-employee-list">
        {filteredEmployees.map((employee) => {
          const employeeName = employee.name ?? "Ohne Namen";

          return (
            <div
              key={employee.id}
              className="mobile-month-emp-pill"
              draggable
              onDragStart={() => handleDragStart(employee.id)}
              onDragEnd={handleDragEnd}
            >
              {employeeName}
            </div>
          );
        })}
      </div>

      <div className="mobile-month-grid">
        <div className="mobile-month-header">Mo</div>
        <div className="mobile-month-header">Di</div>
        <div className="mobile-month-header">Mi</div>
        <div className="mobile-month-header">Do</div>
        <div className="mobile-month-header">Fr</div>
        <div className="mobile-month-header">Sa</div>
        <div className="mobile-month-header">So</div>

        {weeks.map((week) =>
          week.days.map((day) => {
            const holiday = isHoliday(day.iso);
            const shifts = getShiftsForDay(day);

            return (
              <div
                key={day.iso}
                className={`
                  mobile-month-cell
                  ${day.outside ? "mobile-month-outside" : ""}
                  ${holiday?.name ? "mobile-month-holiday-bg" : ""}
                `}
              >
                <div className="mobile-month-day">{day.day}</div>

                {holiday?.name && (
                  <div className="mobile-month-holiday">{holiday.name}</div>
                )}

                <div className="mobile-month-shifts">
                  {shifts.map((shift) => {
                    const shiftAssignments = assignments.filter(
                      (assignment) =>
                        assignment.date === day.iso &&
                        assignment.shift_name === shift.name &&
                        assignment.station_id === stationId
                    );

                    return (
                      <div
                        key={`${day.iso}-${shift.name}`}
                        className="mobile-month-shift"
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.currentTarget.classList.add(
                            "mobile-drop-active"
                          );
                        }}
                        onDragLeave={(event) =>
                          event.currentTarget.classList.remove(
                            "mobile-drop-active"
                          )
                        }
                        onDrop={(event) => {
                          event.preventDefault();
                          event.currentTarget.classList.remove(
                            "mobile-drop-active"
                          );
                          handleDrop(day.iso, shift.name);
                        }}
                      >
                        <strong>{shift.name}</strong>
                        <span>
                          {shift.start} – {shift.end}
                        </span>

                        <div className="mobile-month-emp-list">
                          {shiftAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="mobile-month-emp-pill"
                              draggable
                              onDragStart={() =>
                                handleDragStart(assignment.employee_id)
                              }
                              onDragEnd={handleDragEnd}
                            >
                              {getEmployeeName(assignment.employee_id)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}