import { useState } from "react";
import { useNews } from "../../hooks/useNews";
import InfoPage from "./InfoPage";
import InfoDetail from "./InfoDetail";
import InfoEditor from "./InfoEditor";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
  visible_for_roles: string[];
}

interface Props {
  stationId: string;
  role: "admin" | "planner" | "employee";
  userId: string;
}

export default function InfoPageWrapper({ stationId, role, userId }: Props) {
  const safeStation = (stationId ?? "").toLowerCase();

  const {
    news,
    readIds,
    unreadCount,
    markAsRead,
    createNews,
    deleteNews
  } = useNews(safeStation, userId);

  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <div style={{ padding: "20px" }}>

      {/* LISTE */}
      {!selected && !editorOpen && (
        <>
          {(role === "admin" || role === "planner") && (
            <button
              style={{ marginBottom: "20px" }}
              onClick={() => setEditorOpen(true)}
            >
              + Neue Info
            </button>
          )}

          <InfoPage
            news={news}
            unreadCount={unreadCount}
            onOpenDetail={(n: NewsItem) => {
              setSelected(n);
              markAsRead(n.id);
            }}
          />
        </>
      )}

      {/* DETAIL */}
      {selected && (
        <InfoDetail
          info={selected}
          isRead={readIds.includes(selected.id)}
          role={role}
          onClose={() => setSelected(null)}
          onMarkRead={(id: string) => markAsRead(id)}
          onDelete={(id: string) => {
            deleteNews(id);
            setSelected(null);
          }}
        />
      )}

      {/* EDITOR */}
      {editorOpen && (
        <InfoEditor
          stationId={safeStation}
          onSave={(data: Omit<NewsItem, "id" | "created_at">) => {
            createNews(data);
            setEditorOpen(false);
          }}
          onCancel={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
