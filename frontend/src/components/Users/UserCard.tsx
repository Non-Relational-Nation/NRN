import { useNavigate } from "react-router-dom";
import type { User } from "../../models/User";
import "./styles.css";
import UserAvatar from "./UserAvatar";
import { useState } from "react";
import ErrorDialog from "../Dialogs/ErrorDialog";
import { useMutation } from "@tanstack/react-query";
import { followUser, unfollowUser } from "../../api/users";

interface UserCardProps {
  user: User;
  disableUserAvatar?: boolean;
}

export default function UserCard({ user, disableUserAvatar }: UserCardProps) {
  const navigate = useNavigate();
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  const [following, setFollowing] = useState(user?.following);

  const followMutation = useMutation({
    mutationFn: () => followUser(user?.handle),
    onSuccess: () => {
      setFollowing(true);
    },
    onError: (error: Error) => setErrorDialogMessage(error.message),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(user?.handle),
    onSuccess: () => {
      setFollowing(false);
    },
    onError: (error: Error) => setErrorDialogMessage(error.message),
  });

  const handleFollow = () => followMutation.mutate();
  const handleUnfollow = () => unfollowMutation.mutate();

  const handleClick = () => {
    navigate(`/profile/${user?.handle}`);
  };
  return (
    <>
      <article id="user-card" onClick={handleClick}>
        {!disableUserAvatar && <UserAvatar imageUrl={user?.avatar} size={40} />}
        <p>{user?.handle}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (following) {
              handleUnfollow();
            } else {
              handleFollow();
            }
          }}
          className="button"
        >
          {following ? "unfollow" : "follow"}
        </button>
      </article>
      <ErrorDialog
        isOpen={!!errorDialogMessage}
        onClose={() => setErrorDialogMessage("")}
        errorMessage={errorDialogMessage}
      ></ErrorDialog>
    </>
  );
}
