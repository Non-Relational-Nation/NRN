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
  const { user = sessionStorage.getItem("HANDLE") } = useParams();
  const isMyProfile = user === sessionStorage.getItem("HANDLE");
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
    gcTime: 0,
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
  } = useQuery<Post[]>({
    queryKey: ["feed", user],
    queryFn: () => getUsersFeed(user || "1"),
    retry: false,
    enabled: !!user,
    gcTime: 0,
  });

  const profileNotFound = userError;

  const followMutation = useMutation({
    mutationFn: () => followUser(userData?.handle),
    onSuccess: () => {
      setFollowing(true);
      setFollowerCount((prev) => (prev ?? 0) + 1);
    },
    onError: () => setErrorDialogMessage("Failed to follow user"),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(userData?.handle),
    onSuccess: () => {
      setFollowing(false);
      setFollowerCount((prev) => (prev ?? 0) - 1);
    },
    onError: () => setErrorDialogMessage("Failed to unfollow user"),
  });

  const handleFollow = () => followMutation.mutate();
  const handleUnfollow = () => unfollowMutation.mutate();

  const [username, domain] = userData?.handle.split("@") || [];

  if (profileNotFound) {
    return (
      <Layout loading={false} error={null}>
        <div className="profile-not-found">
          <h2>Profile not found</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout loading={isUserFeedLoading || isUserLoading} error={null}>
      <section id="profile-container">
        <section id="profile-header-container">
          <header id="profile-header" className="card">
            <UserAvatar size={40} imageUrl={userData?.avatar} />
            <h3 className="info-text">{userData?.displayName}</h3> 
            <p className="info-text">@{username}<wbr/>@{domain}</p>
            {userData?.bio && <p className="info-text">{userData.bio}</p>}
            <section id="follower-container">
              <section id="follow-counts">
                <span
                  onClick={() => isMyProfile && navigate(`/profile/followers`)}
                  className={
                    isMyProfile
                      ? "count unbordered-button count-button"
                      : "count"
                  }
                >
                  Followers: <b>{followerCount}</b>
                </span>
                <span
                  onClick={() => isMyProfile && navigate(`/profile/following`)}
                  className={
                    isMyProfile
                      ? "count unbordered-button count-button"
                      : "count"
                  }
                >
                  Following: <b>{userData?.followingCount}</b>
                </span>
                <span className="count">
                  Posts: <b>{userData?.postsCount}</b>
                </span>
              </section>
              {!isMyProfile &&
                (following ? (
                  <button
                    className="filled-button"
                    id="follow-button"
                    onClick={handleUnfollow}
                  >
                    Unfollow
                  </button>
                ) : (
                  <button
                    className="filled-button"
                    id="follow-button"
                    onClick={handleFollow}
                  >
                    Follow
                  </button>
                ))}
              {isMyProfile && (
                <button
                  className="filled-button"
                  id="logout-button"
                  onClick={() => logout()}
                >
                  Logout
                </button>
              )}
            </section>
          </header>
        </section>
        <PostList posts={userFeed}></PostList>
      </section>
      <ErrorDialog
        isOpen={!!errorDialogMessage}
        onClose={() => setErrorDialogMessage("")}
        errorMessage={errorDialogMessage}
      ></ErrorDialog>
    </Layout>
  );
}
