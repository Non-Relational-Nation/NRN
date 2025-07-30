import "./styles.css";

import Layout from "../../components/Layout/Layout";
import PostList from "../../components/Posts/PostList";
import { getFeed } from "../../api/posts";
import type { Post } from "../../models/Post";
import { useQuery } from "@tanstack/react-query";

export default function Feed() {

  const {
    data: feedPosts,
    isLoading: isFeedLoading,
    error: feedError,
  } = useQuery<Post[]>({
    queryKey: [`feed`],
    queryFn: () => getFeed(),
    retry: false,
  });

  return (
    <Layout loading={isFeedLoading} error={feedError}>
      <PostList posts={feedPosts ?? []}></PostList>
    </Layout>
  );
}
