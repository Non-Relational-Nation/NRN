import { useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import "./styles.css";
import PostList from "../../components/Posts/PostList";
import type { Post } from "../../models/Post";
import { useQuery } from "@tanstack/react-query";
import { getUsersFeed } from "../../api/posts";
import type { User } from "../../models/User";
import { followUser, getUser, unfollowUser } from "../../api/users";
import UserAvatar from "../../components/Users/UserAvatar";
import { useEffect, useState } from "react";

export default function Profile() {
  const { user = sessionStorage.getItem("MY_USER_ID") } = useParams();
  const isMyProfile = user === sessionStorage.getItem("MY_USER_ID");

  const {
    data: userData,
    isLoading: isUserLoading,
    error: userError,
  } = useQuery<User>({
    queryKey: ["feed", user],
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
    queryKey: ["user", user],
    queryFn: () => getUsersFeed(user || "1"),
    retry: false,
  });

  const { refetch: followRefetch, error: followError } = useQuery({
    queryKey: [`follow-user-${user}`],
    queryFn: () => followUser(userData?.id),
    enabled: false,
    retry: false,
    gcTime: 0,
  });

  const { refetch: unfollowRefetch, error: unfollowError } = useQuery({
    queryKey: [`unfollow-user-${user}`],
    queryFn: () => unfollowUser(userData?.id),
    enabled: false,
    retry: false,
    gcTime: 0,
  });

  const handleFollow = async () => {
    await followRefetch();
    setFollowing(true);
    setFollowerCount((followerCount ?? 0) + 1);
  };

  const handleUnfollow = async () => {
    await unfollowRefetch();
    setFollowing(false);
    setFollowerCount((followerCount ?? 0) - 1);
  };

  return (
    <Layout
      loading={isUserFeedLoading || isUserLoading}
      error={userFeedError || userError || followError || unfollowError}
    >
      <section id="profile-container">
        <section id="profile-header-container">
          <header id="profile-header">
            <UserAvatar size={40} imageUrl={userData?.avatar} />
            <h3 className="info-text">{userData?.displayName}</h3>
            <p className="info-text">@{userData?.username}</p>
            {userData?.email && (
              <p
                className="info-text"
                style={{ fontSize: "0.9em", color: "#888" }}
              >
                {userData.email}
              </p>
            )}
            {userData?.bio && <p className="info-text">{userData.bio}</p>}
            <section id="follower-container">
              <section id="follow-counts">
                <span>
                  Followers: <b>{followerCount}</b>
                </span>
                <span>
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
                <button
                  className="button"
                  id="edit-profile-button"
                  onClick={() => alert("Edit profile coming soon!")}
                >
                  Edit Profile
                </button>
              )}
            </section>
          </header>
        </section>
        <PostList posts={userFeed}></PostList>
      </section>
    </Layout>
  );
}
