import Layout from "../../components/Layout/Layout";
import { useState } from "react";
import "./styles.css";
import type { User } from "../../models/User";
import { searchUsers } from "../../api/users";
import { useQuery } from "@tanstack/react-query";
import UserCard from "../../components/Users/UserCard";
import Loader from "../../components/Loader/Loader";
import ErrorPage from "../ErrorPage/ErrorPage";
import searchIcon from "../../assets/search.svg";

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
    gcTime: 0,
  });

  const handleSearch = () => {
    refetch();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
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
            onKeyDown={(e) => handleKeyDown(e)}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <img
            src={searchIcon}
            id="search-icon"
            alt="Search"
            onClick={handleSearch}
            width={20}
            height={20}
          />
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
