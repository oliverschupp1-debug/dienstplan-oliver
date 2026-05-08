import MonthCalendar from "./components/MonthCalendar";
import EmployeeManager from "./components/EmployeeManager";
import SlidePanel from "./components/SlidePanel";
import { useEmployees } from "./useEmployees";
import "./global.css";
import "./styles.css";

const STATIONS = [
  { label: "Aral Lindenberg", id: "lindenberg" },
  { label: "Bell Oil Station Wilnsdorf", id: "wilnsdorf" },
  { label: "Bell Oil Station Siegen‑Seelbach", id: "seelbach" }
];

// Titel-Mapping für die Anzeige oben rechts
const STATION_TITLES: Record<string, string> = {
  lindenberg: "Dienstplan Aral Lindenberg",
  wilnsdorf: "Dienstplan Bell Oil Station Wilnsdorf",
  seelbach: "Dienstplan Bell Oil Station Siegen‑Seelbach"
};

export default function App() {
  const [station, setStation] = useState(STATIONS[0].id);
  const [panelOpen, setPanelOpen] = useState(false);

  const {
    employees,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    reload
  } = useEmployees(station);

  return (
    <div className="app-container" style={{ padding: "20px" }}>
      
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
          alignItems: "center"
        }}
      >
        {/* Station Auswahl */}
        <div>
          <h2>Station auswählen</h2>
          <select
            className="input"
            value={station}
            onChange={(e) => setStation(e.target.value)}
          >
            {STATIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Titel rechtsbündig */}
        <h1 style={{ textAlign: "right", margin: 0 }}>
          {STATION_TITLES[station]}
        </h1>

        {/* Mitarbeiter-Button */}
        <button
          className="btn btn-primary"
          onClick={() => setPanelOpen(true)}
          style={{ height: "40px" }}
        >
          Mitarbeiter
        </button>
      </div>

      {/* Kalender */}
      <MonthCalendar
        stationName={station}
        employees={employees}
        initialAssignments={[]}
        initialOverrides={[]}
      />

      {/* Slide‑In Panel */}
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)}>
        <EmployeeManager
          employees={employees}
          loading={loading}
          addEmployee={addEmployee}
          updateEmployee={updateEmployee}
          deleteEmployee={deleteEmployee}
          reload={reload}
        />
      </SlidePanel>
    </div>
  );
}
