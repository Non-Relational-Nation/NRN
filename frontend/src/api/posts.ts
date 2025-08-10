import { type CreatePost, type Post, type PostsPage } from "../models/Post";
import { apiFetch, handleError } from "../util/api";

// Get the feed of the user (Posts from the users they follow)
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
  await handleError(response, "Failed to get users feed");
  const data = await response.json();
  return {
    items: data || [],
    nextOffset: data?.length < limit ? undefined : pageParam + limit,
  };
}

// Get posts for a specific user
export async function getUsersFeed(userHandle: string): Promise<Post[]> {
  const response = await apiFetch({
    path: `/api/posts/author/${userHandle}`,
    method: "GET",
  });
  await handleError(response, "Failed to get posts for this user");
  const data = await response.json();
  return data || [];
}

function extractPostId(postIdOrUrl: string): string {
  try {
    const url = new URL(postIdOrUrl);
    const segments = url.pathname.split("/");
    return segments.pop() || postIdOrUrl;
  } catch {
    return postIdOrUrl;
  }
}

export async function likePost(postIdOrUrl: string): Promise<Post> {
  const postId = extractPostId(postIdOrUrl);

  const response = await apiFetch({
    path: `/api/posts/${postId}/like`,
    method: "POST",
  });
  await handleError(response, "Failed to like post");
  const data = await response.json();
  return data;
}

export async function unlikePost(postIdOrUrl: string): Promise<Post> {
  const postId = extractPostId(postIdOrUrl);
  const response = await apiFetch({
    path: `/api/posts/${postId}/unlike`,
    method: "POST",
  });
  await handleError(response, "Failed to unlike post");
  return await response.json();
}

export async function createPost(post: CreatePost): Promise<void> {
  const formData = new FormData();
  formData.append("content", post.content);
  formData.append("title", "");
  formData.append("visibility", "public");
  if (post.file) {
      formData.append("files", post.file);
  }
  const response = await apiFetch({
    path: `/api/posts`,
    method: "POST",
    body: formData,
  });
  await handleError(response);
}
