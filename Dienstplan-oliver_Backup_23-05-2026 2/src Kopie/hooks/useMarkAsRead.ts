import { supabase } from "../lib/supabaseClient";

export async function markNewsAsRead(newsId: string, userId: string) {
  if (!newsId || !userId) return;

  // Prüfen, ob bereits gelesen
  const { data: existing } = await supabase
    .from("news_read")
    .select("id")
    .eq("news_id", newsId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return; // schon gelesen
  }

  // Eintrag erstellen
  const { error } = await supabase
    .from("news_read")
    .insert({
      news_id: newsId,
      user_id: userId,
    });

  if (error) {
    console.error("Error marking news as read:", error);
  }
}
