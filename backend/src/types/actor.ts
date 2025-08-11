export interface Actor {
  id: string;
  user_id: string | null;
  uri: URL;
  handle: string;
  name: string | null;
  inbox_url: string;
  shared_inbox_url: string | null;
  url: string | null;
  created: string;
}
