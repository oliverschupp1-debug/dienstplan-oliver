import { useMemo } from "react";
import { useAssignments } from "../useAssignments";
import { getShiftModelForStation } from "../shiftModelsDefault";
import { isHoliday } from "../calendar/holidays";
import "./MobileTodayView.css";

type Employee = {
  id: string;
  name: string;
};

type Props = {
  stationName: string;
  employees: Employee[];
  onOpenMonth: () => void;
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

export default function MobileTodayViewEmployee({
  stationName,
  employees,
  onOpenMonth,
}: Props) {
  const today = new Date();
  const iso = getLocalISO(today);

  const stationId = stationName;
  const { assignments } = useAssignments(stationId);

  const model = getShiftModelForStation(stationId);
  const holiday = isHoliday(iso);
  const holidayName = holiday?.name ?? undefined;

  const weekdayIndex = (today.getDay() + 6) % 7;

  const shiftList = useMemo(() => {
    if (holidayName && model.holiday.length > 0) return model.holiday;
    if (weekdayIndex === 6) return model.sunday;
    if (weekdayIndex === 5) return model.saturday;
    return model.weekdays;
  }, [holidayName, weekdayIndex, model]);

  function getEmployeeName(employeeId: string) {
    return (
      employees.find((employee) => employee.id === employeeId)?.name ??
      "Unbekannt"
    );
  }

  const weekdayNames = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
  ];

  return (
    <div className="mobile-root">
      <div className="mobile-today-header">
        <div />

        <div>
          <h2 className="mobile-today-title">
            {weekdayNames[weekdayIndex]}, {today.getDate()}.
            {today.getMonth() + 1}.{today.getFullYear()}
          </h2>

          {holidayName && (
            <div className="mobile-holiday-banner">{holidayName}</div>
          )}
        </div>

        <div />
      </div>

      <div className="admin-override-row">
        <button className="mobile-button" type="button" onClick={onOpenMonth}>
          Monatsansicht
        </button>
      </div>

      <div className="mobile-shift-list">
        {shiftList.map((shift) => {
          const storedShiftName = getStoredShiftName(
            today,
            shift.name,
            holidayName
          );

          const shiftAssignments = assignments.filter(
            (assignment) =>
              assignment.date === iso &&
              assignment.station_id === stationId &&
              normalizeShiftName(assignment.shift_name) ===
                normalizeShiftName(storedShiftName)
          );

          return (
            <div key={`${iso}-${shift.name}`} className="mobile-shift-card">
              <div className="mobile-shift-title">
                <strong>{shift.name}</strong>
                <span>
                  {shift.start} – {shift.end}
                </span>
              </div>

              <div className="mobile-employee-list">
                {shiftAssignments.length === 0 && (
                  <div className="mobile-empty-hint">Nicht besetzt</div>
                )}

                {shiftAssignments.map((assignment) => (
                  <span key={assignment.id} className="mobile-employee-pill">
                    {getEmployeeName(assignment.employee_id)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}