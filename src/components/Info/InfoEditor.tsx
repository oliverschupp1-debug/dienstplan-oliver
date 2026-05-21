import { useState } from "react";

interface NewsInput {
  title: string;
  content: string;
}

interface Props {
  stationId: string;
  onSave: (data: NewsInput) => void;
  onCancel: () => void;
}

export default function InfoEditor({ onSave, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function handleSave() {
    if (!title.trim()) return;
    onSave({ title, content });
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Neue Info</h2>

      <input
        type="text"
        placeholder="Titel"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: "10px" }}
      />

      <textarea
        placeholder="Inhalt"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width: "100%", height: "150px" }}
      />
