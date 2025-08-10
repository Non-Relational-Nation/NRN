import { type User } from "../models/User";
import { apiFetch, handleError } from "../util/api";

export async function searchUsers(searchTerm: string): Promise<User[]> {
  const response = await apiFetch({
    path: `/api/users/${searchTerm}`,
    method: "GET",
  });
  await handleError(response, "Search failed");
  const user = await response.json();
  return [user];
}

export async function getUser(userHandle: string): Promise<User> {
  const response = await apiFetch({
    path: `/api/users/${userHandle}`,
    method: "GET",
  });
  await handleError(response, "Failed to get users profile");
  return await response.json();
}

export async function followUser(handle?: string): Promise<void> {
  if (!handle) {
    throw new Error(`No user handle provided for follow`);
  }

  const response = await apiFetch({
    path: `/api/users/${handle}/following`,
    method: "POST",
  });
  await handleError(response, "Failed to follow user");
  return await response.json();
}

export async function unfollowUser(handle?: string): Promise<void> {
  if (!handle) {
    throw new Error(`No user handle provided for unfollow`);
  }
  const response = await apiFetch({
    path: `/api/users/${handle}/unfollow`,
    method: "POST",
  });
  await handleError(response, "Failed to unfollow user");
  return await response.json();
}

export async function getUserFollowers(): Promise<User[]> {
  const username = sessionStorage.getItem("USERNAME");
  if (!username) {
    throw new Error(`No username provided`);
  }

  const response = await apiFetch({
    path: `/api/users/${username}/followers`,
    method: "GET",
  });
  await handleError(response, "Failed to get followers list");
  const data = await response.json();
  return data?.followers;
}

export async function getUserFollowing(): Promise<User[]> {
  const username = sessionStorage.getItem("USERNAME");
  if (!username) {
    throw new Error(`No username provided`);
  }

  const response = await apiFetch({
    path: `/api/users/${username}/following`,
    method: "GET",
  });
  await handleError(response, "Failed to get following list");
  const data = await response.json();
  return data?.following;
}
