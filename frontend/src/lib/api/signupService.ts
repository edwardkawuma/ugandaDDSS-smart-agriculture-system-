import { AuthEndpoint } from './endpoints.auth';
import { authClient } from './authClient';
export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  user_id: string;
}

export const signupService = {
  signUp: async (data: SignupPayload): Promise<SignupResponse> => {
    const res = await authClient.post<SignupResponse>(AuthEndpoint.AUTH.SIGNUP, data);
    return res.data;
  },
};
