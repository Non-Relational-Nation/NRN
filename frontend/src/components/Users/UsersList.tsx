import type { User } from "../../models/User";
import UserCard from "./UserCard";

interface UserListProps {
  users: User[];
  disableUserAvatar?: boolean;
}

export default function UserList({ users, disableUserAvatar }: UserListProps) {
  return !users.length ? (
    <section id="no-users-section">No users found</section>
  ) : (
    <div id="users-list">
      {users.map((user, index) => (
        <UserCard user={user} key={index} disableUserAvatar={disableUserAvatar} />
      ))}
    </div>
  );
}
