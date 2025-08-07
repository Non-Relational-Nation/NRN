import type { User } from "../../models/User";
import UserCard from "./UserCard";

interface UserListProps {
  users: User[];
}

export default function UserList({ users }: UserListProps) {
  const filteredUsers = users.filter(
    (user) => user.id !== sessionStorage.getItem("MY_USER_ID")
  );
  return !filteredUsers.length ? (
    <section id="no-users-section">No users found</section>
  ) : (
    <div id="users-list">
      {filteredUsers.map((user, index) => (
        <UserCard user={user} key={index}></UserCard>
      ))}
    </div>
  );
}
