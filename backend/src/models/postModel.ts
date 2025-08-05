import { Schema, Document, Types, model } from 'mongoose';
import { PostVisibility, PostType } from '../types/post.js';

const mediaItemSchema = new Schema({
  type: { type: String, enum: ['image', 'video'], required: true },
  url: { type: String, required: true },
  thumbnailUrl: String,
  duration: Number,
  width: Number,
  height: Number,
  size: Number,
  altText: String,
}, { _id: false });

const postSchema = new Schema({
  authorId: { type: String, required: true },
  title: { type: String },
  type: { type: String, enum: Object.values(PostType), default: PostType.TEXT },
  content: String,
  media: [mediaItemSchema],
  originalPostId: String,
  repostComment: String,
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  repostsCount: { type: Number, default: 0 },
  viewsCount: { type: Number, default: 0 },
  hashtags: [String],
  mentions: [String],
  visibility: { type: String, enum: Object.values(PostVisibility), default: PostVisibility.PUBLIC },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  flagged: { type: Boolean, default: false },
});

export interface PostDocument extends Document {
  uri: string;
  actor_id: Types.ObjectId;
  content: string;
  url?: string;
  create_at: Date;
}

const activityPubPostSchema = new Schema<PostDocument>({
  uri: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v: string) => v.trim() !== "",
      message: "URI cannot be empty",
    },
  },
  actor_id: {
    type: Schema.Types.ObjectId,
    ref: "Actor",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    validate: {
      validator: (v: string | undefined) => {
        if (!v) return true; // optional
        return /^https?:\/\/.+/.test(v);
      },
      message: "URL must start with http:// or https://",
    },
  },
  create_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
}); 
export const PostModel = model('Post', postSchema);
export const ActivityPubPostModel = model('ActivityPubPost', activityPubPostSchema);
