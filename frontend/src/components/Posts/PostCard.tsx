import type { Post } from "../../models/Post";
import "./styles.css";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article id="post">
      <header id="post-header">
        <span>Posted by {post?.postedBy?.username}</span>
        <span>{(new Date(post?.postedAt)?.toLocaleString())}</span>
      </header>
      <section id="post-content">
        <p>
          {post?.content}
        </p>
      </section>
      <footer id="post-footer">
        <button>Like</button>
        <span>{post?.likes} Likes</span>
      </footer>
    </article>
  );
}
