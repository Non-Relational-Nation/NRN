import type { EditProfile } from "../models/Post";
import { type User } from "../models/User";
import { apiFetch, handleError } from "../util/api";

export async function searchUsers(searchTerm: string): Promise<User[]> {
  const response = await apiFetch({
    path: `/api/users?search=${encodeURIComponent(searchTerm)}`,
    method: "GET",
  });
  await handleError(response);

  return await response.json();
}

export async function getUser(userHandle: string): Promise<User> {
  const response = await apiFetch({
    path: `/api/users/${userHandle}`,
    method: "GET",
  });
  await handleError(response);

  return await response.json();
}

export async function followUser(username?: string): Promise<void> {
  if (!username) {
    throw new Error(`User not found`);
  }

  const response = await apiFetch({
    path: `/api/users/${username}/following`,
    method: "POST",
  });
  await handleError(response);

  return await response.json();
}

export async function unfollowUser(userId?: string): Promise<void> {
  if (!userId) {
    throw new Error(`No user Id provided`);
  }
  const response = await apiFetch({
    path: `/api/users/${userId}/following`,
    method: "DELETE",
  });
  await handleError(response);

  return await response.json();
}

export async function editProfile(userDetails: EditProfile): Promise<void> {
  const formData = new FormData();
  formData.append("username", userDetails.username);
  formData.append("displayName", userDetails.displayName);
  formData.append("bio", userDetails.bio);
  if (userDetails.avatar) {
    formData.append("avatar", userDetails.avatar);
  }

  const response = await apiFetch({
    path: `/api/user`,
    method: "PUT",
    body: formData,
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
