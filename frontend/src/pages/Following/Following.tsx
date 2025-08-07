import Layout from "../../components/Layout/Layout";
import type { User } from "../../models/User";
import { useQuery } from "@tanstack/react-query";
import UserList from "../../components/Users/UsersList";
import { getUserFollowing } from "../../api/users";
import "./styles.css";

export default function Following() {
  const {
    data: users = [],
    isFetching,
    error,
  } = useQuery<User[]>({
    queryKey: ["following"],
    queryFn: () => getUserFollowing(),
    retry: false,
    gcTime: 0,
  });
  return (
    <Layout loading={isFetching} error={error}>
      <section id="following-container">
        <h2>Following</h2>
        <UserList users={users} />
      </section>
    </Layout>
  );
}
