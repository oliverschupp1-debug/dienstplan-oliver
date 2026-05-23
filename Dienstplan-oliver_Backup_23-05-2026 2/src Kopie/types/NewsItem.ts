export interface NewsItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
  visible_for_roles?: string[];
}
