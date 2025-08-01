import { Post, CreatePostData, UpdatePostData, PostVisibility } from '../types/post.js';
import { IPostRepository } from './interfaces/IPostRepository.js';
import { PostModel } from '../models/postModel.js';

function toPost(obj: any): Post {
  const { _id, __v, ...rest } = obj;
  return { ...rest, id: _id.toString() };
}

export const postRepository: IPostRepository = {
  async create(data: CreatePostData): Promise<Post> {
    const doc = await PostModel.create({ ...data });
    return toPost(doc.toObject());
  },

  async findById(id: string): Promise<Post | null> {
    const doc = await PostModel.findById(id);
    return doc ? toPost(doc.toObject()) : null;
  },

  async findByAuthorId(authorId: string, limit = 20, offset = 0): Promise<Post[]> {
    const docs = await PostModel.find({ authorId }).skip(offset).limit(limit);
    return docs.map((d: any) => toPost(d.toObject()));
  },

  async update(id: string, data: UpdatePostData): Promise<Post | null> {
    const doc = await PostModel.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true });
    return doc ? toPost(doc.toObject()) : null;
  },

  async delete(id: string): Promise<boolean> {
    const doc = await PostModel.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() });
    return !!doc;
  },

  async searchPosts(query: string, limit = 20, offset = 0): Promise<Post[]> {
    const docs = await PostModel.find({ content: { $regex: query, $options: 'i' } }).skip(offset).limit(limit);
    return docs.map((d: any) => toPost(d.toObject()));
  },

  async getPublicPosts(limit = 20, offset = 0): Promise<Post[]> {
    const docs = await PostModel.find({ visibility: PostVisibility.PUBLIC }).skip(offset).limit(limit);
    return docs.map((d: any) => toPost(d.toObject()));
  },

  async getPostsByVisibility(authorId: string, visibility: 'public' | 'private' | 'followers', limit = 20, offset = 0): Promise<Post[]> {
    const docs = await PostModel.find({ authorId, visibility }).skip(offset).limit(limit);
    return docs.map((d: any) => toPost(d.toObject()));
  },
};
