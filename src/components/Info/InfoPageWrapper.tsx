import React, { useState } from "react";
import { useNews } from "../../hooks/useNews";
import InfoPage from "./InfoPage";
import InfoDetail from "./InfoDetail";
import InfoEditor from "./InfoEditor";

export default function InfoPageWrapper({ stationId, role, userId }) {
  // Crash-Schutz
  const safeStation = (stationId ?? "").toLowerCase();

  // ⭐ useNews korrekt aufrufen
  const {
    news,
    readIds,
    unreadCount,
    markAsRead,
    createNews,
    deleteNews
  } = useNews(safeStation, userId);

  const [selected, setSelected] = useState(null);
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
            onOpenDetail={(n) => {
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
          onMarkRead={(id) => markAsRead(id)}
          onDelete={(id) => {
            deleteNews(id);
            setSelected(null);
          }}
        />
      )}

      {/* EDITOR */}
      {editorOpen && (
        <InfoEditor
          stationId={safeStation}
          onSave={(data) => {
            createNews(data);
            setEditorOpen(false);
          }}
          onCancel={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
