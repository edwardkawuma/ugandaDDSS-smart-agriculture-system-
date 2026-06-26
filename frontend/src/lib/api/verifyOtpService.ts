import { AuthEndpoint } from './endpoints.auth';
import { authClient } from './authClient';

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  token: string;
  user_id: string;
  role?: string;
}

export const verifyOtpService = {
  verifyOtp: async (data: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
    const res = await authClient.post<VerifyOtpResponse>(AuthEndpoint.AUTH.VERIFY_OTP, data);
    return res.data;
  },

  resendOtp: async (email: string): Promise<void> => {
    await authClient.post(AuthEndpoint.AUTH.RESEND_OTP, { email });
  },
};
