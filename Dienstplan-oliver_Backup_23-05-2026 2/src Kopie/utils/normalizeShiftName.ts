// src/utils/normalizeShiftName.ts
export function normalizeShiftName(raw: string): string {
  if (!raw) return "";

  let name = raw.trim();

  // Präfixe wie "Feiertag Früh", "Sonntag Früh", "Samstag Früh" entfernen
  name = name.replace(/^feiertag\s+/i, "");
  name = name.replace(/^sonntag\s+/i, "");
  name = name.replace(/^samstag\s+/i, "");

  // Mehrfache Leerzeichen normalisieren
  name = name.replace(/\s+/g, " ");

  // "Früh2" → "Früh 2"
  name = name.replace(/früh\s*2/i, "Früh 2");

  // "Mittel frei wählbar" → "Mittel"
  if (/^mittel\s+frei\s+wählbar/i.test(name)) {
    name = "Mittel";
  }

  return name.trim();
}
