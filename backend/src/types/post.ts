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
  id: string;
  authorId: string;
  content: string;
  title?: string;
  visibility: 'public' | 'private' | 'followers';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostData {
  authorId: string;
  content: string;
  title?: string;
  visibility?: 'public' | 'private' | 'followers';
}

export interface UpdatePostData {
  content?: string;
  title?: string;
  visibility?: 'public' | 'private' | 'followers';
}

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
}
