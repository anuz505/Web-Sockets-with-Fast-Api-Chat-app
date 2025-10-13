export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
}
export const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: localStorage.getItem("access_token") || null,
  error: null,
};
export interface User {
  id: number;
  email: string;
  username: string;
}
export interface UserDetail {
  id: number;
  email: string;
  username: string;
  created_at: Date;
}
export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
}
export interface LoginFormData {
  username: string;
  password: string;
}
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ErrorResponse {
  detail: string;
}
