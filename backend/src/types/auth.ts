export interface AuthUser {
  iss?: string;
  azp?: string;
  aud?: string | string[];
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat?: number;
  exp?: number;
}
