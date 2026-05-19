interface NewsItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Props {
  info: NewsItem;
  isRead: boolean;
  role: "admin" | "planner" | "employee";
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function InfoDetail({
  info,
  isRead,
  role,
  onClose,
  onMarkRead,
  onDelete
}: Props) {
  return (
    <div style={{ padding: "20px" }}>
      <h2>{info.title}</h2>

      <p style={{ opacity: 0.7 }}>
        {new Date(info.created_at).toLocaleString()}
      </p>

      <p>{info.content}</p>

      {!isRead && (
        <button onClick={() => onMarkRead(info.id)}>Als gelesen markieren</button>
      )}

      {role !== "employee" && (
        <button
          style={{ marginLeft: "10px", color: "red" }}
          onClick={() => onDelete(info.id)}
        >
          Löschen
        </button>
      )}

      <button style={{ marginTop: "20px" }} onClick={onClose}>
        Zurück
      </button>
    </div>
  );
}
