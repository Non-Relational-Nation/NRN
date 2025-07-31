import { useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import "./styles.css";
import PostList from "../../components/Posts/PostList";
import type { Post } from "../../models/Post";
import { useQuery } from "@tanstack/react-query";
import { getUsersFeed } from "../../api/posts";
import type { User } from "../../models/User";
import { followUser, getUser } from "../../api/users";
import UserAvatar from "../../components/Users/UserAvatar";

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

  const {
    data: userFeed = [],
    isLoading: isUserFeedLoading,
    error: userFeedError,
  } = useQuery<Post[]>({
    queryKey: ["user", user],
    queryFn: () => getUsersFeed(user || "1"),
    retry: false,
  });

  const { refetch, error: followError } = useQuery({
    queryKey: [`follow-user-${user}`],
    queryFn: () => followUser(userData?.id),
    enabled: false,
    retry: false,
  });

  const handleFollow = async () => {
    await refetch();
  };

  return (
    <Layout
      loading={isUserFeedLoading || isUserLoading}
      error={userFeedError || userError || followError }
    >
      <section id="profile-container">
        <header id="profile-header">
          <UserAvatar size={40}></UserAvatar>
          <h3 id="username-text">{userData?.username}</h3>
          <section id="follower-container">
            <span>Followers: {userData?.followersCount}</span>
            <span>Following: {userData?.followingCount}</span>
            {!isMyProfile && (
              <button id="follow-button" onClick={handleFollow}>
                Follow
              </button>
            )}
          </section>
        </header>
        <PostList posts={userFeed}></PostList>
      </section>
    </Layout>
  );
}
