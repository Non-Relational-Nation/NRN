import React, { useEffect, useState } from "react";
import { getUsers, getUserRecommendations } from "../../api/users";
import type { User } from "../../models/User";
import UserCard from "./UserCard";

interface SuggestedUsersProps {
  userIds: string[];
  loading: boolean;
  error: string | null;
  useSmartRecommendations?: boolean;
}

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({ userIds, loading, error, useSmartRecommendations = false }) => {
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{userId: string, score: number, reason: string}>>([]);
  const [_, setError] = useState<string | null>(null);

  const refreshData = async () => {
    if (useSmartRecommendations) {
      try {
        const recs = await getUserRecommendations();
        setRecommendations(recs);
        const users = await getUsers(recs.map(r => r.userId));
        setSuggestedUsers(users);
      } catch (err: any) {
        if (err instanceof Error && err.message.includes('401')) {
          setError('You must be logged in to see recommendations.');
        }
      }
    } else {
      if (!userIds || userIds.length === 0) {
        setSuggestedUsers([]);
        return;
      }
      try {
        const users = await getUsers(userIds);
        setSuggestedUsers(users);
      } catch (err: any) {
        if (err instanceof Error && err.message.includes('401')) {
          setError('You must be logged in to see suggestions.');
        }
      }
    }
  };

  useEffect(() => {
    refreshData();
  }, [userIds, useSmartRecommendations]);

  // Listen for follow events to refresh suggestions
  useEffect(() => {
    const handleFollowChange = () => {
      setTimeout(refreshData, 1000); // Small delay to ensure backend is updated
    };
    
    window.addEventListener('userFollowed', handleFollowChange);
    window.addEventListener('userUnfollowed', handleFollowChange);
    
    return () => {
      window.removeEventListener('userFollowed', handleFollowChange);
      window.removeEventListener('userUnfollowed', handleFollowChange);
    };
  }, [useSmartRecommendations, userIds]);

  if (loading) return <div>Loading suggestions...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {suggestedUsers.map((user) => {
        const recommendation = useSmartRecommendations ? recommendations.find(r => r.userId === user.handle) : null;
        return (
          <div key={user.id} style={{ marginBottom: 12 }}>
            <UserCard user={user} />
            {recommendation && (
              <div style={{ fontSize: '0.8em', color: '#666', marginTop: 4 }}>
                {recommendation.reason}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SuggestedUsers;