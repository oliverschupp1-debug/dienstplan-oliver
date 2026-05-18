import React from "react";
import "./StationSelect.css";

type Props = {
  stations: { id: string; name: string }[];
  value: string;
  onChange: (v: string) => void;
};

export default function StationSelect({ stations, value, onChange }: Props) {
  return (
    <select
      className="station-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Station wählen…</option>
      {stations.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
