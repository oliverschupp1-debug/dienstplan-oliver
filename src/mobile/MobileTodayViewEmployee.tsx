import { useMemo } from "react";
import { useAssignments } from "../useAssignments";
import { useOverrides } from "../useOverrides";
import { getShiftModelForStation } from "../shiftModelsDefault";
import { isHoliday } from "../calendar/holidays";
import "./MobileTodayView.css";

type Employee = {
  id: string;
  name: string;
};

type Props = {
  stationName: string;
  stationIds?: string[];
  employees: Employee[];
  onOpenMonth: () => void;
};

type DisplayAssignment = {
  id: string;
  employeeName: string;
  stationId: string;
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

function formatStationName(stationId: string) {
  return stationId.charAt(0).toUpperCase() + stationId.slice(1);
}

function StationDay({
  stationId,
  employees,
}: {
  stationId: string;
  employees: Employee[];
}) {
  const today = new Date();
  const iso = getLocalISO(today);

  const { assignments } = useAssignments(stationId);
  const { overrides } = useOverrides(stationId);

  const model = getShiftModelForStation(stationId);
  const holiday = isHoliday(iso);
  const holidayName = holiday?.name ?? undefined;

  const weekdayIndex = (today.getDay() + 6) % 7;
  const overrideShifts = overrides[iso];

  const shiftList = useMemo(() => {
    if (overrideShifts && overrideShifts.length > 0) {
      return overrideShifts.map((shift) => ({
        name: shift.name,
        start: shift.start,
        end: shift.end,
        employee: shift.employee ?? null,
        isOverride: true,
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
    }));
  }, [overrideShifts, holidayName, weekdayIndex, model]);

  function getEmployeeName(employeeId: string) {
    return (
      employees.find((employee) => employee.id === employeeId)?.name ??
      "Unbekannt"
    );
  }

  const stationAssignments = shiftList
    .map((shift) => {
      const storedShiftName = shift.isOverride
        ? shift.name
        : getStoredShiftName(today, shift.name, holidayName);

      const assignmentPeople: DisplayAssignment[] = assignments
        .filter(
          (assignment) =>
            assignment.date === iso &&
            assignment.station_id === stationId &&
            normalizeShiftName(assignment.shift_name) ===
              normalizeShiftName(storedShiftName)
        )
        .map((assignment) => ({
          id: assignment.id,
          employeeName: getEmployeeName(assignment.employee_id),
          stationId,
        }));

      const overridePeople: DisplayAssignment[] =
        shift.employee && shift.employee.trim() !== ""
          ? [
              {
                id: `${iso}-${stationId}-${shift.name}-${shift.employee}`,
                employeeName: shift.employee,
                stationId,
              },
            ]
          : [];

      return {
        ...shift,
        assignments: [...assignmentPeople, ...overridePeople],
      };
    })
    .filter((shift) => shift.assignments.length > 0);

  if (stationAssignments.length === 0) return null;

  return (
    <section className="mobile-employee-station-block">
      <h3 className="mobile-employee-station-title">
        {formatStationName(stationId)}
      </h3>

      <div className="mobile-shift-list">
        {stationAssignments.map((shift) => (
          <div
            key={`${iso}-${stationId}-${shift.name}-${shift.start}-${shift.end}`}
            className="mobile-shift-card"
          >
            <div className="mobile-shift-title">
              <strong>{shift.name}</strong>
              <span>
                {shift.start} – {shift.end}
              </span>
            </div>

            <div className="mobile-employee-list">
              {shift.assignments.map((assignment) => (
                <span key={assignment.id} className="mobile-employee-pill">
                  {assignment.employeeName}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function MobileTodayViewEmployee({
  stationName,
  stationIds,
  employees,
  onOpenMonth,
}: Props) {
  const today = new Date();
  const iso = getLocalISO(today);
  const holiday = isHoliday(iso);
  const holidayName = holiday?.name ?? undefined;
  const weekdayIndex = (today.getDay() + 6) % 7;

  const visibleStationIds = Array.from(
    new Set((stationIds && stationIds.length > 0 ? stationIds : [stationName]).filter(Boolean))
  );

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

      {visibleStationIds.map((stationId) => (
        <StationDay
          key={stationId}
          stationId={stationId}
          employees={employees}
        />
      ))}
    </div>
  );
}