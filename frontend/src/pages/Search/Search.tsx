import Layout from "../../components/Layout/Layout";
import { useState } from "react";
import "./styles.css";
import type { User } from "../../models/User";
import { searchUsers } from "../../api/users";
import { useQuery } from "@tanstack/react-query";
import UserCard from "../../components/Users/UserCard";
import Loader from "../../components/Loader/Loader";
import ErrorPage from "../ErrorPage/ErrorPage";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: users = [],
    refetch,
    isFetching,
    error,
  } = useQuery<User[]>({
    queryKey: ["searchUsers"],
    queryFn: () => searchUsers(searchTerm),
    enabled: false,
  });

  const handleSearch = () => {
    refetch();
  };

  return (
    <Layout>
      <div id="search-container">
        <div id="search-section">
          <input
            id="search-box"
            type="text"
            placeholder="Search for users"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button id="search-button" onClick={handleSearch}>
            Search
          </button>
        </div>
        {isFetching ? (
          <Loader></Loader>
        ) : error ? (
          <ErrorPage errorMessage={error.message} />
        ) : (
          <div id="users-list">
            {users.map((user, index) => (
              <UserCard user={user} key={index}></UserCard>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
