import type { Post } from "../../models/Post";
import PostCard from "./PostCard";
import "./styles.css";

interface PostListProps {
  posts: Post[];
}

export default function PostList({ posts }: PostListProps) {
  if (!posts?.length) {
    return <section id="empty-container"><p>There are no posts to display</p></section>
  }
  return (
    <section id="post-container">
        {posts?.map((post, index) => (
        <PostCard key={index} post={post} />
      ))}
    </section>
  );
}
