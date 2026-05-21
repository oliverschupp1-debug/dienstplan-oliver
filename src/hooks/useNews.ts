import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

// globaler Channel-Cache (Strict Mode safe)
const channelCache: Record<string, any> = {};

export function useNews(stationId: string, userId: string) {
  const [news, setNews] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const safeStation = stationId; // NICHT lowercased, NICHT verändert

  // -------------------------------------------------------
  // NEWS LADEN
  // -------------------------------------------------------
  const loadNews = useCallback(async () => {
    if (!userId) return;

    setLoading(true);

    let newsQuery = supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });

    // Mitarbeiter haben stationId NICHT im JWT → stationId = ""
    // Policies filtern automatisch → wir dürfen NICHT clientseitig filtern
    if (safeStation) {
      newsQuery = newsQuery.eq("station_id", safeStation);
    }

    const { data: newsData } = await newsQuery;

    const { data: readData } = await supabase
      .from("news_read")
      .select("news_id")
      .eq("user_id", userId);

    setNews(newsData ?? []);
    setReadIds(readData?.map((r) => r.news_id) ?? []);
    setLoading(false);
  }, [safeStation, userId]);

  // -------------------------------------------------------
  // INITIAL LADEN
  // -------------------------------------------------------
  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // -------------------------------------------------------
  // REALTIME — GLOBALER CHANNEL (Strict Mode safe)
  // -------------------------------------------------------
  useEffect(() => {
    if (!userId) return;

    const channelKey = `news-${safeStation || "all"}`;

    // Channel nur EINMAL erstellen
    if (!channelCache[channelKey]) {
      const channel = supabase.channel(channelKey);

      // NEWS Änderungen
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "news"
        },
        () => loadNews()
      );

      // GELESEN Änderungen
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "news_read",
          filter: `user_id=eq.${userId}`
        },
        () => loadNews()
      );

      channel.subscribe();
      channelCache[channelKey] = channel;
    }

    return () => {
      // NICHT unsubscriben → Strict Mode würde doppelt subscriben
    };
  }, [safeStation, userId, loadNews]);

  // -------------------------------------------------------
  // NEWS ERSTELLEN
  // -------------------------------------------------------
  async function createNews(data: {
    title: string;
    content: string;
    visible_for_roles: string[];
  }) {
    await supabase.from("news").insert({
      title: data.title,
      content: data.content,
      visible_for_roles: data.visible_for_roles,
      station_id: safeStation
    });

    loadNews();
  }

  // -------------------------------------------------------
  // ALS GELESEN MARKIEREN
  // -------------------------------------------------------
  async function markAsRead(newsId: string) {
    await supabase.from("news_read").upsert({
      news_id: newsId,
      user_id: userId
    });

    loadNews();
  }

  // -------------------------------------------------------
  // NEWS LÖSCHEN
  // -------------------------------------------------------
  async function deleteNews(newsId: string) {
    await supabase.from("news").delete().eq("id", newsId);

    await supabase.from("news_read").delete().eq("news_id", newsId);

    loadNews();
  }

  // -------------------------------------------------------
  // UNGELESENE ANZAHL
  // -------------------------------------------------------
  const unreadCount = news.filter((n) => !readIds.includes(n.id)).length;

  return {
    news,
    readIds,
    unreadCount,
    loading,
    createNews,
    markAsRead,
    deleteNews
  };
}
