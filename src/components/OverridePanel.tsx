import { useState, useEffect } from "react";
import type { StationShiftModel } from "../shiftModelsDefault";

type Shift = {
  name: string;
  start: string;
  end: string;
};

type OverrideData = {
  date: string;
  note: string;
  shifts: Shift[];
};

type Props = {
  date: string | null;
  onClose: () => void;
  onSave: (override: OverrideData | null) => void;
  shiftModel: StationShiftModel;
  existingOverride: OverrideData | null;
};

export default function OverridePanel({
  date,
  onClose,
  onSave,
  shiftModel,
  existingOverride
}: Props) {
  const [note, setNote] = useState("");
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Panel sichtbar?
  const isOpen = date !== null;

  // Initialdaten laden
  useEffect(() => {
    if (!date) return;

    if (existingOverride) {
      setNote(existingOverride.note);
      setShifts(existingOverride.shifts);
    } else {
      // Standard-Schichten für diesen Tag laden
      const d = new Date(date);
      const weekday = d.getDay();

      let base: Shift[] = [];

      if (weekday === 0) base = shiftModel.sunday;
      else if (weekday === 6) base = shiftModel.saturday;
      else base = shiftModel.weekdays;

      setNote("");
      setShifts(base.map((s) => ({ ...s })));
    }
  }, [date, existingOverride, shiftModel]);

  // Schicht ändern
  const updateShift = (index: number, field: "name" | "start" | "end", value: string) => {
    const updated = [...shifts];
    updated[index] = { ...updated[index], [field]: value };
    setShifts(updated);
  };

  // Schicht löschen
  const deleteShift = (index: number) => {
    const updated = shifts.filter((_, i) => i !== index);
    setShifts(updated);
  };

  // Neue Schicht hinzufügen
  const addShift = () => {
    setShifts([
      ...shifts,
      { name: "Neu", start: "08:00", end: "12:00" }
    ]);
  };

  // Speichern
  const save = () => {
    if (!date) return;
    onSave({
      date,
      note,
      shifts
    });
    onClose();
  };

  // Override löschen
  const removeOverride = () => {
    onSave(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="override-backdrop">
      <div className="override-panel">
        <h2 className="override-title">
          Override für {date}
        </h2>

        <label className="override-label">Notiz</label>
        <textarea
          className="override-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notiz eingeben…"
        />

        <label className="override-label">Schichten</label>

        <div className="override-shift-list">
          {shifts.map((shift, index) => (
            <div key={index} className="override-shift-row">
              <input
                className="override-input small"
                value={shift.name}
                onChange={(e) => updateShift(index, "name", e.target.value)}
              />
              <input
                className="override-input small"
                value={shift.start}
                onChange={(e) => updateShift(index, "start", e.target.value)}
              />
              <input
                className="override-input small"
                value={shift.end}
                onChange={(e) => updateShift(index, "end", e.target.value)}
              />
              <button
                className="override-delete"
                onClick={() => deleteShift(index)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button className="override-add" onClick={addShift}>
          + Schicht hinzufügen
        </button>

        <div className="override-actions">
          <button className="override-cancel" onClick={onClose}>
            Abbrechen
          </button>

          {existingOverride && (
            <button className="override-remove" onClick={removeOverride}>
              Override löschen
            </button>
          )}

          <button className="override-save" onClick={save}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
