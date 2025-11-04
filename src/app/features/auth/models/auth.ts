import { User } from './user';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user?: User;
}
export interface RegisterRequest extends LoginRequest {
  firstName: string;
  lastName: string;
}

export interface RegisterResponse extends LoginResponse {}
