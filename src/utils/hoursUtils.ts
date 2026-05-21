// hoursUtils.ts
// ======================================================
// Berechnung der Stunden für Schichten + Overrides
// ======================================================

// Entfernt Präfixe wie "Feiertag", "Samstag", "Sonntag"
export function normalizeShiftName(name: string): string {
  return name
    .replace(/^(Feiertag|Samstag|Sonntag)\s+/i, "")
    .trim();
}

// Standard-Schichtmodelle (Fallback)
const STANDARD_SHIFT_MODELS: Record<string, { start: string; end: string }> = {
  "Früh": { start: "06:00", end: "14:00" },
  "Früh 2": { start: "07:00", end: "15:00" },
  "Mittel": { start: "09:00", end: "17:00" },
  "Spät": { start: "14:00", end: "22:00" },
};

// Hilfsfunktion: Zeit in Minuten
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Hilfsfunktion: Stunden aus Start/Ende
export function calculateHours(start: string, end: string): number {
  const s = toMinutes(start);
  const e = toMinutes(end);
  let diff = e - s;
  if (diff < 0) diff += 24 * 60; // Über Mitternacht
  return diff / 60;
}

// Hauptfunktion: Stunden für eine Schicht berechnen
export function getShiftHours(
  shiftName: string,
  stationShiftModels: Record<string, { start: string; end: string }> | null,
  override: { start: string; end: string } | null
): number {
  // 1) Override hat höchste Priorität
  if (override) {
    return calculateHours(override.start, override.end);
  }

  // 2) Präfix entfernen
  const cleanName = normalizeShiftName(shiftName);

  // 3) Stations-spezifisches Modell
  if (stationShiftModels && stationShiftModels[cleanName]) {
    const model = stationShiftModels[cleanName];
    return calculateHours(model.start, model.end);
  }

  // 4) Standardmodell
  if (STANDARD_SHIFT_MODELS[cleanName]) {
    const model = STANDARD_SHIFT_MODELS[cleanName];
    return calculateHours(model.start, model.end);
  }

  // 5) Unbekannte Schicht → 0 Stunden
  return 0;
}
