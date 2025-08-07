import type { Post } from "../../models/Post";
import type { User } from "../../models/User";
import PostCard from "./PostCard";
import "./styles.css";

interface PostListProps {
  posts: Post[];
  user: User
}

export default function PostList({ posts, user }: PostListProps) {
  if (!posts?.length) {
    return <section id="empty-container"><p>There are no posts to display</p></section>
  }
  return (
    <section id="post-container">
        {posts?.map((post, index) => (
        <PostCard key={index} post={post} user={user} />
      ))}
    </section>
  );
}
