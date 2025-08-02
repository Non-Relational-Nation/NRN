import mongoose from 'mongoose';
import { PostVisibility, PostType } from '../types/post.js';

const mediaItemSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video'], required: true },
  url: { type: String, required: true },
  thumbnailUrl: String,
  duration: Number,
  width: Number,
  height: Number,
  size: Number,
  altText: String,
}, { _id: false });

const postSchema = new mongoose.Schema({
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

export const PostModel = mongoose.model('Post', postSchema);
