import { User } from './user';

export interface LoginRequest {
  name: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user?: User;
}
export interface RegisterRequest extends LoginRequest {}

export interface RegisterResponse extends LoginResponse {}
