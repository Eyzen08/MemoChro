export type Media = {
  id: string;
  memory_id: string;
  path: string;
  preview_path?: string | null;
  caption: string;
  position: number;
  url?: string;
  preview_url?: string;
};
export type Memory = {
  deleting?: boolean;
  id: string;
  title: string;
  memory_date: string;
  memory_time: string | null;
  description: string;
  mood: string;
  favorite: boolean;
  place_id: string | null;
  created_at: string;
  media?: Media[];
};
export type Album = {
  id: string;
  title: string;
  description: string;
  cover_media_id: string | null;
  created_at: string;
};
export type Story = {
  id: string;
  title: string;
  body: string;
  status: "draft" | "saved";
  cover_media_id: string | null;
  created_at: string;
};
export type Place = {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};
export type Person = {
  id: string;
  name: string;
  relationship: string;
  note: string;
};
export type Tag = { id: string; name: string };
export type Search = Record<string, string | undefined>;
export type ActionState = {
  error?: string;
  message?: string;
  memoryId?: string;
};
