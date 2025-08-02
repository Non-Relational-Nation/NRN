import { mockPosts, type CreatePost, type Post } from "../models/Post";
import { apiFetch } from "../util/api";

export async function getFeed(): Promise<Post[]> {
  return mockPosts;

  const response = await apiFetch({
    path: `/feed`,
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  return await response.json();
}

export async function getUsersFeed(userId: string): Promise<Post[]> {
  return mockPosts.filter((post) => post.authorId === userId);

  const response = await apiFetch({
    path: `/feed/${userId}`,
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  return await response.json();
}

export async function likePost(postId: string): Promise<Post> {
  const response = await apiFetch({
    path: `/post/${postId}/like`,
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  return await response.json();
}

export async function unlikePost(postId: string): Promise<Post> {
  const response = await apiFetch({
    path: `/post/${postId}/unlike`,
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  return await response.json();
}

export async function createPost(post: CreatePost): Promise<Post> {
  const response = await apiFetch({
    path: `/post`,
    method: "POST",
    body: JSON.stringify(post),
  });
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  return await response.json();
}
