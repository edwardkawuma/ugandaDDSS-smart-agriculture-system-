import { AuthEndpoint } from './endpoints.auth';
import { authClient } from './authClient';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user_id: string;
  email: string;
  name: string;
  is_email_verified: number;
  role?: string;
}

export const loginService = {
  signIn: async (data: LoginPayload): Promise<LoginResponse> => {
    const res = await authClient.post<LoginResponse>(AuthEndpoint.AUTH.SIGNIN, data);
    return res.data;
  },
};
