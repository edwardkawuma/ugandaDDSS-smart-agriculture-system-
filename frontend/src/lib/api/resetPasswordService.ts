import apiService from './apiService';
import { AuthEndpoint } from './endpoints.auth';

export interface ResetPasswordPayload {
  reset_token: string;
  newPassword: string;
}

export const resetPasswordService = {
  resetPassword: (data: ResetPasswordPayload): Promise<void> =>
    apiService.post<void>({ endpoint: AuthEndpoint.AUTH.RESET_PASSWORD, data: data as unknown as Record<string, any> }),
};
