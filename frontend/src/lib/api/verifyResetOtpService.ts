import apiService from './apiService';
import { AuthEndpoint } from './endpoints.auth';

export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyResetOtpResponse {
  reset_token: string;
}

export const verifyResetOtpService = {
  verifyResetOtp: (data: VerifyResetOtpPayload): Promise<VerifyResetOtpResponse> =>
    apiService.post<VerifyResetOtpResponse>({ endpoint: AuthEndpoint.AUTH.VERIFY_RESET_OTP, data: data as unknown as Record<string, any> }),

  resendResetOtp: (email: string): Promise<void> =>
    apiService.post<void>({ endpoint: AuthEndpoint.AUTH.RESEND_RESET_OTP, data: { email } }),
};
