export interface User {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  following: boolean;
  handle: string;
}
