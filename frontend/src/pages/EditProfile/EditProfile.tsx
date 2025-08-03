import { useState, useRef, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import "./styles.css";
import { useMutation, useQuery } from "@tanstack/react-query";
import attachIcon from "../../assets/attachment.svg";
import { useNavigate, useParams } from "react-router-dom";
import ErrorDialog from "../../components/Dialogs/ErrorDialog";
import UserAvatar from "../../components/Users/UserAvatar";
import { editProfile, getUser } from "../../api/users";
import type { User } from "../../models/User";

export default function EditProfile() {
  const { user = sessionStorage.getItem("MY_USER_ID") } = useParams();

  const navigate = useNavigate();
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<File>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: userData,
    isLoading: isUserLoading,
    error: userError,
  } = useQuery<User>({
    queryKey: ["user", user],
    queryFn: () => getUser(user || "1"),
    retry: false,
    enabled: !!user,
  });

  useEffect(() => {
    if (userData) {
      setBio(userData.bio ?? "");
      setUsername(userData.username ?? "");
      setDisplayName(userData.displayName ?? "");
    }
  }, [userData]);

  const editProfileMutation = useMutation({
    mutationFn: editProfile,
    onSuccess: () => navigate("/profile"),
    onError: (err: Error) => setErrorDialogMessage(err.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    setAvatar(fileList[0]);
  };

  const handleEditProfile = async () => {
    editProfileMutation.mutate({ displayName, bio, username, avatar });
  };

  return (
    <Layout loading={isUserLoading} error={userError}>
      <section id="edit-profile-container">
        <h2 id="edit-profile-title">Edit Profile</h2>

        <section id="file-input-section">
          <button
            className="button"
            id="add-files-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Update Avatar
            <img src={attachIcon} width={20} height={20} />
            <UserAvatar imageUrl={userData?.avatar} image={avatar} size={30} />
          </button>
          <input
            type="file"
            accept="image/*"
            id="file-input-button"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </section>

        <section className="input-section">
          <label htmlFor="username-input" className="input-label">
            Edit Username
          </label>
          <input
            type="text"
            id="username-input"
            className="input"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </section>

        <section className="input-section">
          <label htmlFor="displayname-input" className="input-label">
            Edit Display Name
          </label>
          <input
            type="text"
            id="displayname-input"
            className="input"
            placeholder="Enter display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </section>

        <section className="input-section">
          <label htmlFor="bio-textarea" className="input-label">
            Bio
          </label>
          <textarea
            id="bio-textarea"
            placeholder="Bio content..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </section>

        <button
          id="confirm-edit-profile-button"
          className="button"
          onClick={handleEditProfile}
        >
          Edit profile
        </button>
      </section>

      <ErrorDialog
        isOpen={!!errorDialogMessage}
        onClose={() => setErrorDialogMessage("")}
        errorMessage={errorDialogMessage}
      />
    </Layout>
  );
}
