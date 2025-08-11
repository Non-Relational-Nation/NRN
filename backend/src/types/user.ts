export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  handle: string;
  following?: boolean;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  displayName: string;
  bio?: string;
}

export interface UpdateUserData {
  displayName?: string;
  bio?: string;
  avatar?: string;
}
