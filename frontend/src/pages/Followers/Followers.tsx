import Layout from "../../components/Layout/Layout";
import type { User } from "../../models/User";
import { useQuery } from "@tanstack/react-query";
import UserList from "../../components/Users/UsersList";
import { getUserFollowers } from "../../api/users";
import "./styles.css";

export default function Followers() {
  const {
    data: users = [],
    isFetching,
    error,
  } = useQuery<User[]>({
    queryKey: ["followers"],
    queryFn: () => getUserFollowers(),
    retry: false,
    gcTime: 0,
  });
  return (
    <Layout loading={isFetching} error={error}>
      <section id="followers-container">
        <h2>Followers</h2>
        <UserList users={users} disableUserAvatar={true} />
      </section>
    </Layout>
  );
}
