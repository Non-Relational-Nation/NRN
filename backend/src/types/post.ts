export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  REPOST = 'repost'
}

export enum PostVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  MENTIONED = 'mentioned',
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' ;
  url: string;
  thumbnailUrl?: string;
  duration?: number; // for video in seconds
  width?: number;
  height?: number;
  size: number; // file size in bytes
  altText?: string;
}

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  content?: string;
  media?: MediaItem[];
  
  // Engagement
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  
  // Metadata
  hashtags: string[];
  mentions: string[];
  visibility: PostVisibility;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Moderation
  isDeleted: boolean;
  deletedAt?: Date;
  flagged: boolean;
}

export interface CreatePostData {
  type: PostType;
  content?: string;
  media?: Omit<MediaItem, 'id'>[];
  visibility: PostVisibility;
}

export interface UpdatePostData {
  content?: string;
  visibility?: PostVisibility;
}
