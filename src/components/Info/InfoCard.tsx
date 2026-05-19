interface NewsItem {
  id: string;
  title: string;
  content?: string;
  created_at: string;
}

interface Props {
  info: NewsItem;
  onClick: () => void;
}

export default function InfoCard({ info, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        cursor: "pointer"
      }}
    >
      <strong>{info.title}</strong>
      <div style={{ opacity: 0.7, fontSize: "0.9em" }}>
        {new Date(info.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}
