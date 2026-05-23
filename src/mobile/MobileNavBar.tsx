import "./MobileNavBar.css";

type Props = {
  role: "admin" | "planner" | "employee";
  activeView: "today" | "month";
  onViewChange: (view: "today" | "month") => void;
  onToggleEmployees?: () => void;
};

export default function MobileNavBar({
  role,
  activeView,
  onViewChange,
  onToggleEmployees,
}: Props) {
  const isStaff = role === "admin" || role === "planner";

  return (
    <nav className="mobile-nav">
      <button
        type="button"
        className={"mobile-nav-item" + (activeView === "today" ? " active" : "")}
        onClick={() => onViewChange("today")}
      >
        Heute
      </button>

      <button
        type="button"
        className={"mobile-nav-item" + (activeView === "month" ? " active" : "")}
        onClick={() => onViewChange("month")}
      >
        Monat
      </button>

      {isStaff && (
        <button
          type="button"
          className="mobile-nav-item mobile-nav-button"
          onClick={onToggleEmployees}
        >
          Mitarbeiter
        </button>
      )}
    </nav>
  );
}