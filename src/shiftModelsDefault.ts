export type Shift = {
  name: string;      // "Früh", "Früh 2", "Mittel", "Spät"
  start: string;     // "06:15"
  end: string;       // "12:15"
};

export type StationShiftModel = {
  weekdays: Shift[];
  saturday: Shift[];
  sunday: Shift[];
  holiday: Shift[];
};

export function getShiftModelForStation(station: string): StationShiftModel {
  const s = (station ?? "").toLowerCase();

  switch (s) {
    case "seelbach":
      return {
        weekdays: [
          { name: "Früh",  start: "05:30", end: "12:00" },
          { name: "Mittel", start: "12:00", end: "17:00" },
          { name: "Spät",  start: "17:00", end: "21:30" }
        ],
        saturday: [
          { name: "Früh",  start: "07:30", end: "12:00" },
          { name: "Mittel", start: "12:00", end: "16:30" },
          { name: "Spät",  start: "16:30", end: "21:30" }
        ],
        sunday: [
          { name: "Früh",  start: "07:30", end: "12:00" },
          { name: "Mittel", start: "12:00", end: "16:30" },
          { name: "Spät",  start: "16:30", end: "21:30" }
        ],
        holiday: [
          { name: "Früh",  start: "07:30", end: "12:00" },
          { name: "Mittel", start: "12:00", end: "16:30" },
          { name: "Spät",  start: "16:30", end: "21:30" }
        ]
      };

    case "wilnsdorf":
      return {
        weekdays: [
          { name: "Früh",  start: "06:00", end: "11:00" },
          { name: "Mittel", start: "frei", end: "wählbar" },
          { name: "Spät",  start: "10:00", end: "18:30" }
        ],
        saturday: [
          { name: "Früh",  start: "07:30", end: "12:30" }
        ],
        sunday: [],
        holiday: []
      };

    case "lindenberg":
    default:
      return {
        weekdays: [
          { name: "Früh",   start: "06:15", end: "12:15" },
          { name: "Früh 2", start: "08:15", end: "12:15" },
          { name: "Mittel", start: "12:00", end: "17:00" },
          { name: "Spät",   start: "16:45", end: "21:15" }
        ],
        saturday: [
          { name: "Früh",   start: "07:45", end: "14:45" },
          { name: "Spät",   start: "14:30", end: "21:15" }
        ],
        sunday: [
          { name: "Früh",   start: "08:45", end: "14:45" },
          { name: "Spät",   start: "14:30", end: "21:15" }
        ],
        holiday: [
          { name: "Früh",   start: "08:45", end: "14:45" },
          { name: "Spät",   start: "14:30", end: "21:15" }
        ]
      };
  }
}
