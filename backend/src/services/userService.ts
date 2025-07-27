import { User, CreateUserData, UpdateUserData, LoginCredentials, AuthTokens } from '../types/user';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';

export class UserService {
  constructor(private userRepository: IUserRepository) {}
    // TODO - implementation
}
