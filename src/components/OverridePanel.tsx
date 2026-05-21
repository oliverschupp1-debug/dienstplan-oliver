import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import "./OverridePanel.css";

type ShiftRow = {
  id?: number;
  name: string;
  start_time: string;
  end_time: string;
  employee?: string | null;
};

type Employee = {
  id: string;
  name: string;
};

type Props = {
  date: string;
  stationName: string;
  onClose: () => void;
};

const ORDER = ["Früh", "Früh 2", "Mittel", "Spät"];

export default function OverridePanel({ date, stationName, onClose }: Props) {
  const [note, setNote] = useState("");
  const [overrideId, setOverrideId] = useState<number | null>(null);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dragActive, setDragActive] = useState<number | null>(null);

  const defaultShifts: ShiftRow[] = [
    { name: "Früh", start_time: "", end_time: "" },
    { name: "Früh 2", start_time: "", end_time: "" },
    { name: "Mittel", start_time: "", end_time: "" },
    { name: "Spät", start_time: "", end_time: "" }
  ];

  // ------------------------------------------------------------
  // BODY SCROLL LOCK (wichtig!)
  // ------------------------------------------------------------
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ------------------------------------------------------------
  // Laden
  // ------------------------------------------------------------
  useEffect(() => {
    async function load() {
      // Mitarbeiter laden
      const { data: empData } = await supabase
        .from("employees")
        .select("id,name")
        .eq("station_id", stationName)
        .order("name", { ascending: true });

      setEmployees(empData ?? []);

      // Overrides laden
      const { data: dayRows } = await supabase
        .from("day_overrides")
        .select("*")
        .eq("station_id", stationName)
        .eq("date", date)
        .limit(1);

      if (!dayRows || dayRows.length === 0) {
        setNote("");
        setOverrideId(null);
        setShifts(defaultShifts);
        return;
      }

      const day = dayRows[0];
      setNote(day.note ?? "");
      setOverrideId(day.id);

      const { data: shiftRows } = await supabase
        .from("override_shifts")
        .select("*")
        .eq("override_id", day.id);

      if (!shiftRows || shiftRows.length === 0) {
        setShifts(defaultShifts);
      } else {
        setShifts(shiftRows as ShiftRow[]);
      }
    }

    load();
  }, [date, stationName]);

  // ------------------------------------------------------------
  // Drag & Drop
  // ------------------------------------------------------------
  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragActive(index);
  }

  function handleDragLeave() {
    setDragActive(null);
  }

  function handleDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragActive(null);

    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed.employeeId) return;

      const emp = employees.find((x) => x.id === parsed.employeeId);
      if (!emp) return;

      updateShift(index, "employee", emp.name);
    } catch {}
  }

  // ------------------------------------------------------------
  // Schicht hinzufügen
  // ------------------------------------------------------------
  function addShift() {
    setShifts((prev) => [
      ...prev,
      {
        name: "Sonstige",
        start_time: "",
        end_time: "",
        employee: null
      }
    ]);
  }

  // ------------------------------------------------------------
  // Schicht ändern
  // ------------------------------------------------------------
  function updateShift(index: number, field: keyof ShiftRow, value: string | null) {
    const updated = [...shifts];
    updated[index] = { ...updated[index], [field]: value };
    setShifts(updated);
  }

  // ------------------------------------------------------------
  // Schicht löschen
  // ------------------------------------------------------------
  function deleteShift(index: number) {
    setShifts((prev) => prev.filter((_, i) => i !== index));
  }

  // ------------------------------------------------------------
  // Speichern
  // ------------------------------------------------------------
  async function handleSave() {
    const allEmpty = shifts.every(
      (s) => s.start_time.trim() === "" && s.end_time.trim() === ""
    );
    const emptyNote = note.trim() === "";

    // FALL A: Alles leer → Tag löschen
    if (allEmpty && emptyNote) {
      if (overrideId) {
        await supabase.from("override_shifts").delete().eq("override_id", overrideId);
        await supabase.from("day_overrides").delete().eq("id", overrideId);
      }
      onClose();
      return;
    }

    // FALL B: Tag speichern (UPSERT)
    const { data: dayData } = await supabase
      .from("day_overrides")
      .upsert({
        station_id: stationName,
        date,
        note
      })
      .select()
      .single();

    const newOverrideId = dayData.id;
    setOverrideId(newOverrideId);

    // Alte Schichten löschen
    await supabase.from("override_shifts").delete().eq("override_id", newOverrideId);

    // Neue Schichten speichern
    const validShifts = shifts.filter(
      (s) => s.start_time.trim() !== "" && s.end_time.trim() !== ""
    );

    if (validShifts.length > 0) {
      const rows = validShifts.map((s) => ({
        override_id: newOverrideId,
        name: s.name,
        start_time: s.start_time,
        end_time: s.end_time,
        employee: s.employee ?? null
      }));

      await supabase.from("override_shifts").insert(rows);
    }

    onClose();
  }

  // ------------------------------------------------------------
  // Gruppierung
  // ------------------------------------------------------------
  function getGroupedShifts() {
    const groups: Record<string, ShiftRow[]> = {
      Früh: [],
      "Früh 2": [],
      Mittel: [],
      Spät: [],
      Sonstige: []
    };

    for (const s of shifts) {
      if (ORDER.includes(s.name)) groups[s.name].push(s);
      else groups["Sonstige"].push(s);
    }

    return groups;
  }

  const groups = getGroupedShifts();

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div
      className="override-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="override-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="override-title">{date}</h2>

        <label className="override-label">Notiz</label>
        <textarea
          className="override-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {Object.keys(groups).map((group) => (
          <div key={group} className="override-group">
            <h3 className="override-group-title">{group}</h3>

            {groups[group].map((shift, index) => {
              const globalIndex = shifts.indexOf(shift);

              return (
                <div
                  key={globalIndex}
                  className={
                    "shift-card" +
                    (dragActive === globalIndex ? " shift-card-active" : "")
                  }
                  onDragOver={(e) => handleDragOver(e, globalIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, globalIndex)}
                >
                  <div className="shift-card-header">
                    <input
                      className="shift-name-input"
                      value={shift.name}
                      onChange={(e) =>
                        updateShift(globalIndex, "name", e.target.value)
                      }
                    />
                    <button
                      className="shift-delete"
                      onClick={() => deleteShift(globalIndex)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="shift-time-row">
                    <input
                      className="shift-time-input"
                      value={shift.start_time}
                      onChange={(e) =>
                        updateShift(globalIndex, "start_time", e.target.value)
                      }
                      placeholder="Start"
                    />
                    <span>–</span>
                    <input
                      className="shift-time-input"
                      value={shift.end_time}
                      onChange={(e) =>
                        updateShift(globalIndex, "end_time", e.target.value)
                      }
                      placeholder="Ende"
                    />
                  </div>

                  {/* Mitarbeiter Dropdown */}
                  <select
                    className="shift-employee-select"
                    value={shift.employee ?? ""}
                    onChange={(e) =>
                      updateShift(globalIndex, "employee", e.target.value || null)
                    }
                  >
                    <option value="">(kein Mitarbeiter)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name}
                      </option>
                    ))}
                  </select>

                  {/* Drag & Drop Zone */}
                  <div className="shift-dropzone">
                    {shift.employee ? (
                      <div className="employee-chip">{shift.employee}</div>
                    ) : (
                      <span className="drop-hint">Mitarbeiter hier ablegen</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <button className="override-add" onClick={addShift}>
          + Schicht hinzufügen
        </button>

        <div className="override-actions">
          <button className="override-cancel" onClick={onClose}>
            Abbrechen
          </button>
          <button className="override-save" onClick={handleSave}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
