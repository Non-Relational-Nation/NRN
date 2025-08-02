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
  following: boolean;
}

export const mockUsers: User[] = [
  {
    id: "1",
    username: "alice",
    email: "alice@example.com",
    displayName: "Alice Johnson",
    bio: "Loves cats and coffee.",
    avatar: "https://example.com/avatars/alice.png",
    followersCount: 120,
    followingCount: 80,
    postsCount: 34,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2025-07-31T10:00:00Z"),
    following: true,
  },
  {
    id: "2",
    username: "bob",
    email: "bob@example.com",
    displayName: "Bob Smith",
    bio: "Tech enthusiast and gamer.",
    avatar: "https://example.com/avatars/bob.png",
    followersCount: 95,
    followingCount: 150,
    postsCount: 50,
    createdAt: new Date("2024-02-10T09:30:00Z"),
    updatedAt: new Date("2025-07-31T10:00:00Z"),
    following: false,
  },
  {
    id: "3",
    username: "charlie",
    email: "charlie@example.com",
    displayName: "Charlie Brown",
    bio: "Photographer & traveler.",
    avatar: "https://example.com/avatars/charlie.png",
    followersCount: 200,
    followingCount: 60,
    postsCount: 78,
    createdAt: new Date("2024-03-20T14:45:00Z"),
    updatedAt: new Date("2025-07-31T10:00:00Z"),
    following: true,
  },
];
