import type { Types } from "mongoose";

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  REPOST = 'repost'
}

export enum PostVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  MENTIONED = 'mentioned'
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string; // S3 URL
  thumbnailUrl?: string; // S3 URL for thumbnail
  duration?: number; // for video in seconds
  width?: number;
  height?: number;
  size: number; // file size in bytes
  altText?: string;
}

export interface Post {
  id: Types.ObjectId;
  type: PostType;
  content?: string;
  media?: MediaItem[]; // Stored in S3, URLs in MongoDB
  
  // Original post data for reposts
  originalPostId?: string;
  repostComment?: string;
  
  // Engagement counters (stored in MongoDB document)
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  
  // Metadata
  hashtags: string[];
  mentions: string[]; // User IDs mentioned in post
  visibility: PostVisibility;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Moderation
  isDeleted: boolean;
  deletedAt?: Date;
  flagged: boolean;
  uri: URL;
  actor: URL;
  actor_id: Types.ObjectId;

}

type attach = {
  url?: String,
  mediaType: String,
  width?: Number,
  height?: Number
};

export interface CreatePostData extends Document {
  uri?: string;
  actor_id: Types.ObjectId;
  content: string;
  url?: string;
  likes_count?: number,
  attachment?: attach[]
  created_at?: Date,
  updated_at?: Date
  is_deleted?: boolean,
  flagged?: boolean
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  visibility?: PostVisibility;
  likesCount?: number;
}

export interface PostLike {
  _id?: Types.ObjectId;
  actor_id: Types.ObjectId;
  post_id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
