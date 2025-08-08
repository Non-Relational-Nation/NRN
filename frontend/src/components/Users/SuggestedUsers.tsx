import React, { useEffect, useState } from "react";
import { getUser } from "../../api/users";
import { followUser } from "../../api/users";
import type { User } from "../../models/User";
import UserCard from "./UserCard";

interface SuggestedUsersProps {
  userIds: string[];
  loading: boolean;
  error: string | null;
}

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({ userIds, loading, error }) => {
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [errorMessage, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchUsers() {
      if (!userIds || userIds.length === 0) {
        setSuggestedUsers([]);
        return;
      }
      const users: (User | null)[] = await Promise.all(
        userIds.map(async (id) => {
          try {
            return await getUser(id);
          } catch (err: any) {
            if (err instanceof Error && err.message.includes('401')) {
              if (isMounted) setError('You must be logged in to see suggestions.');
            }
            return null;
          }
        })
      );
      if (isMounted) setSuggestedUsers(users.filter(Boolean) as User[]);
    }
    fetchUsers();
    return () => { isMounted = false; };
  }, [userIds]);

  const handleFollow = async (handle: string) => {
    try {
      await followUser(handle);
      setSuggestedUsers((prev) => prev.filter((u) => u.handle !== handle));
    } catch (err) {
    }
  };

  if (loading) return <div>Loading suggestions...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {suggestedUsers.map((user) => (
        <div key={user.id} style={{ marginBottom: 12 }}>
          <UserCard user={user} handleFollow={handleFollow} />
        </div>
      ))}
    </div>
  );
};

export default SuggestedUsers;