// EmployeeManager.tsx
import { Employee } from "../useEmployees";

type Props = {
  employees: Employee[];
  loading: boolean;
  addEmployee: (name: string, maxHours: number | null) => void;
  updateEmployee: (id: string, name: string, maxHours: number | null) => void;
  deleteEmployee: (id: string) => void;
  reload: () => void;
};

export default function EmployeeManager({
  employees,
  loading,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  reload
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [maxHours, setMaxHours] = useState<number | null>(100);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addEmployee(trimmed, maxHours);
    setName("");
    setMaxHours(100);
  };

  return (
    <div className="panel" style={{ marginBottom: "20px" }}>
      {/* Toggle Button */}
      <button
        className="btn btn-primary"
        style={{ width: "100%", marginBottom: "10px" }}
        onClick={() => setOpen(!open)}
      >
        {open ? "Mitarbeiterverwaltung schließen" : "Mitarbeiterverwaltung öffnen"}
      </button>

      {/* Wenn geschlossen → nichts anzeigen */}
      {!open && <></>}
      {open && (
        <>
          {/* Eingabe für neuen Mitarbeiter */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <input
              className="input"
              placeholder="Name eingeben…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="input"
              type="number"
              placeholder="Max. Stunden"
              value={maxHours ?? ""}
              onChange={(e) =>
                setMaxHours(e.target.value ? Number(e.target.value) : null)
              }
              style={{ width: "120px" }}
            />

            <button className="btn btn-primary" onClick={handleAdd}>
              Hinzufügen
            </button>

            <button className="btn" onClick={reload}>
              ↻
            </button>
          </div>

          {/* Mitarbeiterliste */}
          {loading ? (
            <p>Lade Mitarbeiter…</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {employees.map((e) => (
                <li
                  key={e.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: "1px solid #ddd"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <strong>{e.name}</strong>
                    <small style={{ opacity: 0.7 }}>
                      Max. Stunden: {e.max_hours ?? "—"}
                    </small>
                  </div>

                  <button
                    className="btn btn-danger"
                    onClick={() => deleteEmployee(e.id)}
                  >
                    Entfernen
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
