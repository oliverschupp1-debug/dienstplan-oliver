import "./Header.css";

type Props = {
  stationName: string;
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToggleTheme: () => void;
  onPrint: () => void;
  onLogout: () => void;
};

export default function Header({
  stationName,
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToggleTheme,
  onPrint,
  onLogout
}: Props) {
  return (
    <header className="header">
      {/* Linke Seite: Stationsname */}
      <div className="header-left">
        <h1 className="header-title">{stationName}</h1>
      </div>

      {/* Mittig: Monatsnavigation */}
      <div className="header-center">
        <button className="header-nav-btn" onClick={onPrevMonth}>
          ←
        </button>

        <span className="header-month">
          {currentDate.toLocaleString("de-DE", {
            month: "long",
            year: "numeric"
          })}
        </span>

        <button className="header-nav-btn" onClick={onNextMonth}>
          →
        </button>
      </div>

      {/* Rechte Seite: Aktionen */}
      <div className="header-right">
        <button className="header-btn" onClick={onToggleTheme}>
          Theme
        </button>

        <button className="header-btn" onClick={onPrint}>
          Drucken
        </button>

        <button className="header-btn logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
