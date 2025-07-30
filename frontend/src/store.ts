import { create } from 'zustand';

interface User {
  displayName: string;
  email: string;
  photoURL: string;
  uid: string;
}

interface Post {
  id: string;
  username: string;
  content: string;
  time: string;
}

interface AppState {
  user: User | null;
  posts: Post[];
  setUser: (user: User | null) => void;
  setPosts: (posts: Post[]) => void;
}

export const useAppStore = create<AppState>(set => ({
  user: null,
  posts: [],
  setUser: user => set({ user }),
  setPosts: posts => set({ posts }),
}));
