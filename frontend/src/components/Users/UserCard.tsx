import { useNavigate } from "react-router-dom";
import type { User } from "../../models/User";
import "./styles.css";
import UserAvatar from "./UserAvatar";
import { useState } from "react";
import ErrorDialog from "../Dialogs/ErrorDialog";

interface UserCardProps {
  user: User;
  disableUserAvatar?: boolean;
}

export default function UserCard({ user, disableUserAvatar }: UserCardProps) {
  const navigate = useNavigate();
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  const [username, domain] = user?.handle.split("@") || [];

  const handleClick = () => {
    navigate(`/profile/${user?.handle}`);
  };
  return (
    <>
      <article id="user-card" className="card" onClick={handleClick}>
        {!disableUserAvatar && <UserAvatar imageUrl={user?.avatar} size={40} />}
        <p id="user-handle-text">
          @{username}
          <wbr />@{domain}
        </p>
      </article>
      <ErrorDialog
        isOpen={!!errorDialogMessage}
        onClose={() => setErrorDialogMessage("")}
        errorMessage={errorDialogMessage}
      />
    </>
  );
}
