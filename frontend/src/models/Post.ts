export enum PostType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  REPOST = "repost",
}

export interface CreatePost {
  content: string;
  files?: File[];
}

export interface MediaItem {
  type: "image" | "video";
  mediaType: string;
  url: string;
}

export interface PostsPage {
  items: Post[];
  nextOffset?: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorHandle: string;
  type: PostType;
  content?: string;
  media?: MediaItem[]; // Stored in S3, URLs in MongoDB
  isLiked: boolean;
  likesCount: number;
  created_at: Date;
}
