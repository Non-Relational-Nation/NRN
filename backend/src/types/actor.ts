import type { Types } from "mongoose";

export interface Actor {
  id: Types.ObjectId;
  user_id: Types.ObjectId | null;
  uri: URL;
  handle: string;
  name: string | null;
  inbox_url: string;
  shared_inbox_url: string | null;
  url: string | null;
  created: string;
}