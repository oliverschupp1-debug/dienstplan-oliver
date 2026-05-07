// shiftModelsDefault.ts
// Zentrale Definition aller Standardschichten für alle drei Stationen

export type ShiftDefinition = {
  name: string;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
};

export type StationShiftModel = {
  weekdays: ShiftDefinition[];
  saturday: ShiftDefinition[];
  sunday: ShiftDefinition[];
  holiday: ShiftDefinition[];
};

// -------------------------------------------------------------
// ARAL LINDENBERG
// -------------------------------------------------------------

export const modelLindenberg: StationShiftModel = {
  weekdays: [
    { name: "Früh",  start: "06:15", end: "12:15" },
    { name: "Früh2", start: "08:15", end: "12:15" },
    { name: "Mittel", start: "12:00", end: "17:00" },
    { name: "Spät",   start: "16:45", end: "21:15" }
  ],

  saturday: [
    { name: "Früh", start: "07:45", end: "14:45" },
    { name: "Spät", start: "14:30", end: "21:15" }
  ],

  sunday: [
    { name: "Früh", start: "08:45", end: "14:45" },
    { name: "Spät", start: "14:30", end: "21:15" }
  ],

  holiday: [
    { name: "Früh", start: "08:45", end: "14:45" },
    { name: "Spät", start: "14:30", end: "21:15" }
  ]
};

// -------------------------------------------------------------
// BELL OIL STATION WILNSDORF
// -------------------------------------------------------------

export const modelWilnsdorf: StationShiftModel = {
  weekdays: [
    { name: "Früh", start: "06:00", end: "11:00" },
    // Mittel existiert NICHT → wird nur über Override hinzugefügt
    { name: "Spät", start: "10:00", end: "18:30" }
  ],

  saturday: [
    { name: "Früh", start: "07:30", end: "12:30" }
    // kein Spät, kein Mittel
  ],

  sunday: [], // geschlossen

  holiday: [] // geschlossen
};

// -------------------------------------------------------------
// BELL OIL STATION SIEGEN-SEELBACH
// -------------------------------------------------------------

export const modelSeelbach: StationShiftModel = {
  weekdays: [
    { name: "Früh",  start: "05:30", end: "12:00" },
    { name: "Mittel", start: "12:00", end: "17:00" },
    { name: "Spät",   start: "17:00", end: "21:30" }
  ],

  saturday: [
    { name: "Früh",  start: "07:30", end: "12:00" },
    { name: "Mittel", start: "12:00", end: "16:30" },
    { name: "Spät",   start: "16:30", end: "21:30" }
  ],

  sunday: [
    { name: "Früh",  start: "07:30", end: "12:00" },
    { name: "Mittel", start: "12:00", end: "16:30" },
    { name: "Spät",   start: "16:30", end: "21:30" }
  ],

  holiday: [
    { name: "Früh",  start: "07:30", end: "12:00" },
    { name: "Mittel", start: "12:00", end: "16:30" },
    { name: "Spät",   start: "16:30", end: "21:30" }
  ]
};

// -------------------------------------------------------------
// EXPORT: Modell-Auswahl nach station_id
// -------------------------------------------------------------

export function getShiftModelForStation(stationId: string): StationShiftModel {
  switch (stationId) {
    case "lindenberg":
      return modelLindenberg;

    case "wilnsdorf":
      return modelWilnsdorf;

    case "seelbach":
      return modelSeelbach;

    default:
      return modelLindenberg; // Fallback
  }
}
