import apiService from './apiService';
import { AuthEndpoint } from './endpoints.auth';

export interface ForgotPasswordPayload {
  email: string;
}

export const forgotPasswordService = {
  forgotPassword: (data: ForgotPasswordPayload): Promise<void> =>
    apiService.post<void>({ endpoint: AuthEndpoint.AUTH.FORGOT_PASSWORD, data: data as unknown as Record<string, any> }),
};
