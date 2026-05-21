import React from "react";
import "../calendar/MonthCalendar.css";


interface EmployeeCardProps {
  shiftName: string;
  time: string;
  employee: string;
  colorClass: string;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export default function EmployeeCard({
  shiftName,
  time,
  employee,
  colorClass,
  onClick,
  draggable = false,
  onDragStart,
}: EmployeeCardProps) {
  return (
    <div
      className={`shift-card ${colorClass}`}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="shift-time">{time}</div>
      <div className="shift-employee">{employee}</div>
    </div>
  );
}
