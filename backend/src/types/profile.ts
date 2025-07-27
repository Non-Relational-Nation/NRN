export interface Profile {
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

export interface UserPreferences {
  notifications: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    mentions: boolean;
    directMessages: boolean;
  };
  privacy: {
    showEmail: boolean;
    showFollowers: boolean;
    showFollowing: boolean;
  };
}

export interface CreateProfileData {
  username: string;
  email: string;
  password: string;
  displayName: string;
  bio?: string;
}

export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}
