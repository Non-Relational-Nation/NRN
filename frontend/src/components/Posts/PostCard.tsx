import { useQuery } from "@tanstack/react-query";
import type { Post } from "../../models/Post";
import "./styles.css";
import { likePost } from "../../api/posts";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { refetch } = useQuery({
    queryKey: ["like-post"],
    queryFn: () => likePost(post?.id),
    enabled: false,
    retry: false,
  });

  const handleLike = async () => {
    await refetch();
  };

  return (
    <article id="post">
      <header id="post-header">
        <span>Posted by {post?.authorId}</span>
        <span>{new Date(post?.createdAt)?.toLocaleString()}</span>
      </header>
      <section id="post-content">
        <p>{post?.content}</p>

        {post?.media?.length ? (
          <div className="post-media-column">
            {post.media.map((item) => (
              <div key={item.id} className="media-item">
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={item.altText || "Post image"}
                    className="media-image"
                    width={item.width}
                    height={item.height}
                  />
                ) : (
                  <video
                    controls
                    width={item.width}
                    height={item.height}
                    className="media-video"
                    poster={item.thumbnailUrl}
                  >
                    <source src={item.url} type="video/mp4" />
                    Your browser does not support video.
                  </video>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </section>
      <footer id="post-footer">
        <button onClick={handleLike}>Like</button>
        <span>{post?.likesCount} Likes</span>
      </footer>
    </article>
  );
}
