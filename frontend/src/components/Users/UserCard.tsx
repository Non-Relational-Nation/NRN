import { useNavigate } from "react-router-dom";
import type { User } from "../../models/User";
import "./styles.css";
import UserAvatar from "./UserAvatar";
import { useState } from "react";
import ErrorDialog from "../Dialogs/ErrorDialog";

interface UserCardProps {
  user: User;
  disableUserAvatar?: boolean;
  showFollowingStatus?: boolean;
}

export default function UserCard({ user, disableUserAvatar, showFollowingStatus = true }: UserCardProps) {
  const navigate = useNavigate();
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  const handle = user?.handle?.startsWith("@") ? user?.handle?.slice(1) : user?.handle
  const [username, domain] = handle.split("@") || [];

  const handleClick = () => {
    navigate(`/profile/${handle}`);
  };
  return (
    <>
      <article id="user-card" className="card" onClick={handleClick}>
        {!disableUserAvatar && <UserAvatar imageUrl={user?.avatar} size={40} />}
        <div style={{ flex: 1 }}>
          <p id="user-handle-text">
            @{username}
            <wbr />@{domain}
          </p>
        </div>
        {showFollowingStatus && user.following && (
          <span className="following-badge">Following</span>
        )}
      </article>
      <ErrorDialog
        isOpen={!!errorDialogMessage}
        onClose={() => setErrorDialogMessage("")}
        errorMessage={errorDialogMessage}
      />
    </>
  );
}
