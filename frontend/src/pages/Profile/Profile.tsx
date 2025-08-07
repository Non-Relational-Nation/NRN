import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import "./styles.css";
import PostList from "../../components/Posts/PostList";
import type { Post } from "../../models/Post";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getUsersFeed } from "../../api/posts";
import type { User } from "../../models/User";
import { followUser, getUser, unfollowUser } from "../../api/users";
import UserAvatar from "../../components/Users/UserAvatar";
import { useEffect, useState } from "react";
import { logout } from "../../util/logout";
import ErrorDialog from "../../components/Dialogs/ErrorDialog";

export default function Profile() {
  const navigate = useNavigate();
  const { user = sessionStorage.getItem("MY_HANDLE") } = useParams();
  const isMyProfile = user === sessionStorage.getItem("MY_HANDLE");

  const [errorDialogMessage, setErrorDialogMessage] = useState("");

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

  const [following, setFollowing] = useState(userData?.following);
  const [followerCount, setFollowerCount] = useState(userData?.followersCount);

  useEffect(() => {
    if (userData) {
      setFollowing(userData.following);
      setFollowerCount(userData.followersCount);
    }
  }, [userData]);

  const {
    data: userFeed = [],
    isLoading: isUserFeedLoading,
    error: userFeedError,
  } = useQuery<Post[]>({
    queryKey: ["feed", user],
    queryFn: () => getUsersFeed(user || "1"),
    retry: false,
  });

  const followMutation = useMutation({
    mutationFn: () => followUser(userData?.username),
    onSuccess: () => {
      setFollowing(true);
      setFollowerCount((prev) => (prev ?? 0) + 1);
    },
    onError: (error: Error) => setErrorDialogMessage(error.message),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(userData?.id),
    onSuccess: () => {
      setFollowing(false);
      setFollowerCount((prev) => (prev ?? 0) - 1);
    },
    onError: (error: Error) => setErrorDialogMessage(error.message),
  });

  const handleFollow = () => followMutation.mutate();
  const handleUnfollow = () => unfollowMutation.mutate();

  return (
    <Layout
      loading={isUserFeedLoading || isUserLoading}
      error={userFeedError || userError}
    >
      <section id="profile-container">
        <section id="profile-header-container">
          <header id="profile-header">
            <UserAvatar size={40} imageUrl={userData?.avatar} />
            <h3 className="info-text">{userData?.displayName}</h3>
            <p className="info-text">@{userData?.handle}</p>
            {userData?.bio && <p className="info-text">{userData.bio}</p>}
            <section id="follower-container">
              <section id="follow-counts">
                <span
                  onClick={() => isMyProfile && navigate(`/followers`)}
                  className={isMyProfile ? "button" : ""}
                >
                  Followers: <b>{followerCount}</b>
                </span>
                <span
                  onClick={() => isMyProfile && navigate(`/following`)}
                  className={isMyProfile ? "button" : ""}
                >
                  Following: <b>{userData?.followingCount}</b>
                </span>
                <span>
                  Posts: <b>{userData?.postsCount}</b>
                </span>
              </section>
              {!isMyProfile &&
                (following ? (
                  <button
                    className="button"
                    id="follow-button"
                    onClick={handleUnfollow}
                  >
                    Unfollow
                  </button>
                ) : (
                  <button
                    className="button"
                    id="follow-button"
                    onClick={handleFollow}
                  >
                    Follow
                  </button>
                ))}
              {isMyProfile && (
                <>
                  {/* <button
                    className="button"
                    id="edit-profile-button"
                    onClick={() => navigate("/profile/edit")}
                  >
                    Edit Profile
                  </button> */}
                  <button
                    className="button"
                    id="logout-button"
                    onClick={() => logout()}
                  >
                    Logout
                  </button>
                </>
              )}
            </section>
          </header>
        </section>
        <PostList posts={userFeed} user={userData}></PostList>
      </section>
      <ErrorDialog
        isOpen={!!errorDialogMessage}
        onClose={() => setErrorDialogMessage("")}
        errorMessage={errorDialogMessage}
      ></ErrorDialog>
    </Layout>
  );
}
