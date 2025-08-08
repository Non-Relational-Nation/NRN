import type { CreatePost, Post, PostsPage } from "../models/Post";
import { apiFetch, handleError } from "../util/api";

// Get the public feed (all public posts)
export async function getFeed({
  pageParam = 0,
}: {
  pageParam?: number;
}): Promise<PostsPage> {
  const limit = 10;
  const response = await apiFetch({
    path: `/api/posts?limit=${limit}&offset=${pageParam}`,
    method: "GET",
  });
  await handleError(response);

  const data = await response.json();
  return {
    items: data,
    nextOffset: data.length < limit ? undefined : pageParam + limit,
  };
}

// Get posts for a specific user
export async function getUsersFeed(userHandle: string): Promise<Post[]> {
  // return [];
  const response = await apiFetch({
    path: `/api/posts/author/${userHandle}`,
    method: "GET",
  });
  await handleError(response);

  const data = await response.json();
  return data || [];
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
  await handleError(response);

  const data = await response.json();
  return data.data;
}

export async function unlikePost(postId: string): Promise<Post> {
  const response = await apiFetch({
    path: `/api/posts/${postId}/like`,
    method: "DELETE",
  });
  await handleError(response);

  return await response.json();
}

// Create a new post
export async function createPost(post: CreatePost): Promise<Post> {
  const formData = new FormData();
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

  await handleError(response);

  const data = await response.json();
  return data.data;
}
