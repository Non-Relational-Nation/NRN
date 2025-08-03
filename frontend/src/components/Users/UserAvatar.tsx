import "./styles.css";
import defaultAvatar from "../../assets/default-avatar.svg"

interface UserAvatarProps {
  imageUrl?: string;
  size: number;
}

export default function UserAvatar({
  imageUrl,
  size = 40,
}: UserAvatarProps) {
  return (
    <div id="user-avatar" style={{ width: size, height: size }}>
      <img
        src={imageUrl ?? defaultAvatar}
        id="avatar-image"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
