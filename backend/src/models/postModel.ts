import type { CreatePostData } from '@/types/post.ts';
import { Schema, Types, model } from 'mongoose';

const postSchema = new Schema<CreatePostData>({
  actor_id: { 
    type: Schema.Types.ObjectId,
    ref: "Actor",
    required: true,
  },
  uri: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v: string) => v.trim() !== "",
      message: "URI cannot be empty",
    },
  },

  content: {
    type: String,
    required: true,
  },

  attachment: [{
    url: {
      type: String,
    },
    mediaType: {
      type: String,
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    }
  }],

  likes_count: { type: Number, default: 0 },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  is_deleted: { type: Boolean, default: false },
  flagged: { type: Boolean, default: false },
    url: {
    type: String,
  },
});

export const PostModel = model('Post', postSchema);

