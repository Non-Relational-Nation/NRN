import { useNavigate } from "react-router-dom";
import type { User } from "../../models/User";
import "./styles.css";
import UserAvatar from "./UserAvatar";

interface UserCardProps {
  user: User;
}

export default function UserCard({ user }: UserCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/profile/${user?.id}`);
  };
  return (
    <article id="user-card" onClick={handleClick}>
      <UserAvatar size={40}></UserAvatar>
      <p>{user?.username}</p>
    </article>
  );
}
