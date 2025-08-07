import type { Post } from "../../models/Post";
import "./styles.css";
import heart from "../../assets/heart.svg";
import redHeart from "../../assets/red-heart.svg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { likePost, unlikePost } from "../../api/posts";
import ErrorDialog from "../Dialogs/ErrorDialog";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");

  const likeMutation = useMutation({
    mutationFn: () => likePost(post.id),
    onSuccess: () => {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    },
    onError: (error: Error) => {
      setErrorDialogMessage(error.message);
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: () => unlikePost(post.id),
    onSuccess: () => {
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    },
    onError: (error: Error) => {
      setErrorDialogMessage(error.message);
    },
  });

  const handleLike = () => likeMutation.mutate();
  const handleUnlike = () => unlikeMutation.mutate();

  return (
    <article id="post">
      <header id="post-header">
        <button
          className="button"
          id="profile-button"
          onClick={() => navigate(`/profile/${post.authorHandle}`)}
        >

          {post?.authorHandle}
        </button>
        {post?.created_at && (
          <span id="time-text">
            {new Date(post.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" - "}
            {new Date(post.created_at).toLocaleDateString()}
          </span>
        )}
      </header>
      <hr />
      <section id="post-content">
        {post?.content && <p>{post?.content}</p>}

        {post?.media?.length ? (
          <div className="post-media-column">
            {post.media.map((item, index) => (
              <div key={index} className="media-item">
                {item.type.toUpperCase() === "IMAGE" ? (
                  <img
                    src={item.url}
                    className="media-image"

                  />
                ) : (
                  <video
                    controls
                    className="media-video"
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
          <img
            className="like-button"
            title="Unlike post"
            src={redHeart}
            onClick={handleUnlike}
            width={20}
            height={20}
          />
        ) : (
          <img
            className="like-button"
            title="Like post"
            src={heart}
            onClick={handleLike}
            width={20}
            height={20}
          />
        )}

        <span>{likesCount ?? 0}</span>
      </footer>
      <ErrorDialog
        isOpen={!!errorDialogMessage}
        onClose={() => setErrorDialogMessage("")}
        errorMessage={errorDialogMessage}
      ></ErrorDialog>
    </article>
  );
}
