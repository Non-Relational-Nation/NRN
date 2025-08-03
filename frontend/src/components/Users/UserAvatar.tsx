import { useEffect, useState } from "react";
import "./styles.css";
import defaultAvatar from "../../assets/default-avatar.svg";

interface UserAvatarProps {
  imageUrl?: string;
  image?: File;
  size?: number;
}

export default function UserAvatar({
  imageUrl,
  image,
  size = 40,
}: UserAvatarProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl ?? null);

  useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(imageUrl ?? null);
    }
  }, [image, imageUrl]);

  return (
    <div id="user-avatar" style={{ width: size, height: size }}>
      <img
        src={previewUrl || defaultAvatar}
        alt="User avatar"
        id="avatar-image"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
