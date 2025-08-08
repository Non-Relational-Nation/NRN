import { type User } from "../models/User";
import { apiFetch, handleError } from "../util/api";

export async function searchUsers(searchTerm: string): Promise<User[]> {
  const response = await apiFetch({
    path: `/api/users/${searchTerm}`,
    method: "GET",
  });
  await handleError(response);
  const user = await response.json()
  return [user];
}

export async function getUser(userHandle: string): Promise<User> {
  const response = await apiFetch({
    path: `/api/users/${userHandle}`,
    method: "GET",
  });
  await handleError(response);

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
  await handleError(response);

  return await response.json();
}

export async function unfollowUser(handle?: string): Promise<void> {
  if (!handle) {
    throw new Error(`No user handle provided for unfollow`);
  }
  const response = await apiFetch({
    path: `/api/users/${handle}/following`,
    method: "DELETE",
  });
  await handleError(response);

  return await response.json();
}

export async function getUserFollowers(): Promise<User[]> {
  const username = sessionStorage.getItem("MY_USERNAME");
  if (!username) {
    throw new Error(`No username provided`);
  }

  const response = await apiFetch({
    path: `/api/users/${username}/followers`,
    method: "GET",
  });
  await handleError(response);

  const data = await response.json()
  return data?.followers;
}

export async function getUserFollowing(): Promise<User[]> {
  const username = sessionStorage.getItem("MY_USERNAME");
  if (!username) {
    throw new Error(`No username provided`);
  }

  const response = await apiFetch({
    path: `/api/users/${username}/following`,
    method: "GET",
  });
  await handleError(response);

  const data = await response.json()
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
