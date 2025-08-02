// import { useQuery } from "@tanstack/react-query";
import type { Post } from "../../models/Post";
import "./styles.css";
// import { likePost } from "../../api/posts";
import heart from "../../assets/heart.svg";
import redHeart from "../../assets/red-heart.svg";
import { useState } from "react";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  // const { refetch: likePostRefetch } = useQuery({
  //   queryKey: ["like-post"],
  //   queryFn: () => likePost(post?.id),
  //   enabled: false,
  //   retry: false,
  // });

  // const { refetch: unlikePostRefetch } = useQuery({
  //   queryKey: ["unlike-post"],
  //   queryFn: () => likePost(post?.id),
  //   enabled: false,
  //   retry: false,
  // });

  const handleLike = async () => {
    // await likePostRefetch();
    setIsLiked(true);
    setLikesCount(likesCount + 1);
  };

  const handleUnlike = async () => {
    // await unlikePostRefetch();
    setIsLiked(false);
    setLikesCount(likesCount - 1);
  };

  return (
    <article id="post">
      <header id="post-header">
        <span>Posted by {post?.authorId}</span>
        <span>
          {new Date(post?.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" - "}
          {new Date(post?.createdAt).toLocaleDateString()}
        </span>
      </header>
      <hr />
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
      <hr />
      <footer id="post-footer">
        {isLiked ? (
          <img className="like-button" title="Unlike post" src={redHeart} onClick={handleUnlike} width={25} height={25} />
        ) : (
          <img className="like-button" title="Like post" src={heart} onClick={handleLike} width={25} height={25} />
        )}

        <span>{likesCount}</span>
      </footer>
    </article>
  );
}
