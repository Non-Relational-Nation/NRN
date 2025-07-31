import type { Post } from "../../models/Post";
import "./styles.css";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article id="post">
      <header id="post-header">
        <span>Posted by {post?.authorId}</span>
        <span>{(new Date(post?.createdAt)?.toLocaleString())}</span>
      </header>
      <section id="post-content">
        <p>
          {post?.content}
        </p>
      </section>
      <footer id="post-footer">
        <button>Like</button>
        <span>{post?.likesCount} Likes</span>
      </footer>
    </article>
  );
}
