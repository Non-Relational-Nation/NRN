import { findUserByUsername } from "../repositories/userRepository.ts";

export class UserService {
  getUserByUsername = async (username: string) => {
    const user = await findUserByUsername(username);

    return user;
  };
}

export default new UserService();
