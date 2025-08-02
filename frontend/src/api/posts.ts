import type { CreatePost, Post } from "../models/Post";
import { apiFetch } from "../util/api";

// Get the public feed (all public posts)
export async function getFeed(): Promise<Post[]> {
  const response = await apiFetch({
    path: `/api/posts`,
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }
  const data = await response.json();
  // Backend returns { success, data: { posts, pagination } }
  return data.data?.posts || [];
}

// Get posts for a specific user
export async function getUsersFeed(userId: string): Promise<Post[]> {
  const response = await apiFetch({
    path: `/api/posts/author/${userId}`,
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }
  const data = await response.json();
  return data.data?.posts || [];
}

// Like a post (if endpoint exists)
export async function likePost(postId: string): Promise<Post> {
  const userId = sessionStorage.getItem("MY_USER_ID");
  if (!userId) throw new Error("Not authenticated");
  const response = await apiFetch({
    path: `/api/posts/${postId}/like`,
    method: "POST",
    body: JSON.stringify({ authorId: userId }),
  });
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }
  const data = await response.json();
  return data.data;
}

// Create a new post
export async function createPost(post: CreatePost): Promise<Post> {
  const authorId = sessionStorage.getItem("MY_USER_ID");
  if (!authorId) throw new Error("Not authenticated");
  const formData = new FormData();
  formData.append("authorId", authorId);
  formData.append("content", post.content);
  formData.append("title", "");
  formData.append("visibility", "public");
  if (post.files) {
    post.files.forEach((file) => {
      formData.append("files", file);
    });
  }
  const response = await apiFetch({
    path: `/api/posts`,
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }
  const data = await response.json();
  return data.data;
}
