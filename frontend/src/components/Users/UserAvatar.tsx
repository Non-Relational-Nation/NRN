import "./styles.css";

interface UserAvatarProps {
  imageUrl?: string;
  size: number;
}

export default function UserAvatar({
  imageUrl = "https://www.gravatar.com/avatar/?d=identicon",
  size = 40,
}: UserAvatarProps) {
  return (
    <div id="user-avatar" style={{ width: size, height: size }}>
      <img
        src={imageUrl}
        id="avatar-image"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
