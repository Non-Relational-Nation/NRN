import { mockUsers, type User } from "./User";

export interface Post {
  content: string;
  postedAt: EpochTimeStamp;
  postedBy: User;
  likes: number;
}

export const mockPosts: Post[] = [
  {
    content: "Just joined Non-Relational Nation! Excited to be here 🚀",
    postedAt: Date.now() - 1000 * 60 * 5,
    postedBy: mockUsers[0],
    likes: 12,
  },
  {
    content: "Working on a new project. Loving the TypeScript + React combo.",
    postedAt: Date.now() - 1000 * 60 * 30,
    postedBy: mockUsers[1],
    likes: 7,
  },
  {
    content: "Coffee + code = perfect morning ☕💻",
    postedAt: Date.now() - 1000 * 60 * 60,
    postedBy: mockUsers[2],
    likes: 21,
  },
  {
    content: "Anyone else trying out serverless for their side projects?",
    postedAt: Date.now() - 1000 * 60 * 120,
    postedBy: mockUsers[1],
    likes: 5,
  },
];
