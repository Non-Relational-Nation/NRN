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

export async function getUsers(userHandles: string[]): Promise<User[]> {
  const response = await apiFetch({
    path: `/api/users/batch`,
    method: "POST",
    body: JSON.stringify({ handles: userHandles }),
  });
  await handleError(response, "Failed to get users");
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
  
  // Dispatch event to refresh suggestions
  window.dispatchEvent(new CustomEvent('userFollowed', { detail: { handle } }));
  
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
  
  // Dispatch event to refresh suggestions
  window.dispatchEvent(new CustomEvent('userUnfollowed', { detail: { handle } }));
  
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

export async function getUserSuggestions(): Promise<string[]> {
  const response = await apiFetch({
    path: `/api/users/suggestions`,
    method: "GET",
  });
  await handleError(response);
  const data = await response.json();
  return data.suggestions;
}

export async function getUserRecommendations(): Promise<Array<{userId: string, score: number, reason: string}>> {
  const response = await apiFetch({
    path: `/api/users/recommendations`,
    method: "GET",
  });
  await handleError(response, "Failed to get recommendations");
  return await response.json();
}

export async function getNetworkStats(): Promise<{followers: number, following: number, mutualConnections: number, networkReach: number}> {
  const response = await apiFetch({
    path: `/api/users/network-stats`,
    method: "GET",
  });
  await handleError(response, "Failed to get network stats");
  return await response.json();
}
