import { mockUsers, type User } from "../models/User";
import { apiFetch } from "../util/api";

export async function searchUsers(searchTerm: string): Promise<User[]> {
  return mockUsers.filter(
    (user) => user?.username?.toUpperCase() === searchTerm.toUpperCase()
  );
  const response = await apiFetch({
    path: `/feed`,
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`${response.status}`);
  }

  return await response.json();
}
