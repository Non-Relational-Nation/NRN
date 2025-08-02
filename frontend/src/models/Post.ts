import { mockUsers } from "./User";

export enum PostType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  REPOST = "repost",
}

export enum PostVisibility {
  PUBLIC = "public",
  FOLLOWERS = "followers",
  MENTIONED = "mentioned",
}

export interface CreatePost {
  content: string;
  files?: File[];
}

export interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string; // S3 URL
  thumbnailUrl?: string; // S3 URL for thumbnail
  duration?: number; // for video in seconds
  width?: number;
  height?: number;
  size?: number; // file size in bytes
  altText?: string;
}

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  content?: string;
  media?: MediaItem[]; // Stored in S3, URLs in MongoDB

  // Original post data for reposts
  originalPostId?: string;
  repostComment?: string;

  // Engagement counters (stored in MongoDB document)
  isLiked: boolean;
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

  // Enriched author object (from backend)
  author?: import("./User").User;
}

const mockMediaItems: MediaItem[] = [
  {
    id: "1",
    type: "image",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=200&fit=crop",
    width: 1920,
    height: 1080,
    size: 350000,
    altText: "Mountain landscape during sunrise",
  },
  {
    id: "2",
    type: "video",
    url: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    thumbnailUrl: "https://peach.blender.org/wp-content/uploads/bbb-splash.png",
    duration: 60,
    width: 1280,
    height: 720,
    size: 1048576,
    altText: "Sample animation video",
  },
];

export const mockPosts: Post[] = [
  {
    id: "post1",
    authorId: mockUsers[0].id,
    type: PostType.TEXT,
    content: "Just joined Non-Relational Nation! Excited to be here 🚀",
    media: mockMediaItems,
    originalPostId: undefined,
    repostComment: undefined,
    isLiked: false,
    likesCount: 12,
    commentsCount: 3,
    repostsCount: 1,
    viewsCount: 150,
    hashtags: ["#introduction", "#excited"],
    mentions: [],
    visibility: PostVisibility.PUBLIC,
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5),
    isDeleted: false,
    deletedAt: undefined,
    flagged: false,
  },
  {
    id: "post2",
    authorId: mockUsers[1].id,
    type: PostType.TEXT,
    content: "Working on a new project. Loving the TypeScript + React combo.",
    media: [],
    originalPostId: undefined,
    repostComment: undefined,
    isLiked: true,
    likesCount: 7,
    commentsCount: 2,
    repostsCount: 0,
    viewsCount: 98,
    hashtags: ["#typescript", "#react"],
    mentions: [],
    visibility: PostVisibility.PUBLIC,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30),
    isDeleted: false,
    deletedAt: undefined,
    flagged: false,
  },
  {
    id: "post3",
    authorId: mockUsers[2].id,
    type: PostType.TEXT,
    content: "Coffee + code = perfect morning ☕💻",
    media: [],
    originalPostId: undefined,
    repostComment: undefined,
    isLiked: true,
    likesCount: 21,
    commentsCount: 5,
    repostsCount: 2,
    viewsCount: 220,
    hashtags: ["#coffee", "#coding"],
    mentions: [],
    visibility: PostVisibility.PUBLIC,
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60),
    isDeleted: false,
    deletedAt: undefined,
    flagged: false,
  },
  {
    id: "post4",
    authorId: mockUsers[1].id,
    type: PostType.TEXT,
    content: "Anyone else trying out serverless for their side projects?",
    media: [],
    originalPostId: undefined,
    repostComment: undefined,
    isLiked: true,
    likesCount: 5,
    commentsCount: 1,
    repostsCount: 0,
    viewsCount: 80,
    hashtags: ["#serverless", "#cloud"],
    mentions: [],
    visibility: PostVisibility.PUBLIC,
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120),
    isDeleted: false,
    deletedAt: undefined,
    flagged: false,
  },
];
