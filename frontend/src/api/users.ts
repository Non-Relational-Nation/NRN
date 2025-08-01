import { mockUsers, type User } from "../models/User";
import { apiFetch } from "../util/api";

export async function searchUsers(searchTerm: string): Promise<User[]> {
  const response = await apiFetch({
    path: `/users?search=${encodeURIComponent(searchTerm)}`,
    method: "GET",
  });
  if (!response.ok) throw new Error(`${response.status}`);
  return await response.json();
}

export async function getUser(userId: string): Promise<User> {
  const response = await apiFetch({
    path: `/api/users/${userId}`,
    method: "GET",
  });
  if (!response.ok) throw new Error(`${response.status}`);
  return await response.json();
}

export async function followUser(userId?: string): Promise<User> {
  if (!userId) {
    throw new Error(`No user Id provided`);
  }

  return mockUsers.find((user) => user.id === userId) ?? mockUsers[0];

  const response = await apiFetch({
    path: `/users/${userId}/follow`,
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  return await response.json();
}

export async function unfollowUser(userId?: string): Promise<User> {
  if (!userId) {
    throw new Error(`No user Id provided`);
  }

  return mockUsers.find((user) => user.id === userId) ?? mockUsers[0];

  const response = await apiFetch({
    path: `/users/${userId}/follow`,
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }
  return await response.json();
}
