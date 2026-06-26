// language: TypeScript
// file_name: interceptors.ts
// file_path: src/lib/api/interceptors.ts
// description: This file contains the ApiInterceptors class which handles request/response interceptors.

// Imports
import { STORAGE_KEYS } from '@/constants/Storagekey';
import { globalToastUtils } from '@/lib/toast-manager';
import { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ErrorResponseData } from './interfaces/api.interface';

/**
 * Setup request and response interceptors for the axios instance
 */
export class ApiInterceptors {
  constructor(private axiosInstance: AxiosInstance) {}

  /**
   * Setup request and response interceptors
   */
  setupInterceptors(): void {
    // Request interceptor - Add auth token, loading states, etc.
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for debugging
        (config as unknown as Record<string, unknown>).metadata = { startTime: new Date() };
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle success and error responses
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Handle successful responses
        this.handleSuccessResponse(response);
        return response;
      },
      (error: AxiosError) => {
        // Handle error responses
        this.handleErrorResponse(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle successful API responses
   */
  private handleSuccessResponse(response: AxiosResponse): void {
    const { config, data } = response;
    
    // Check if response contains a token and save it to localStorage
    if (data?.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
    }
    
    // Only show success toast for POST, PUT, DELETE operations
    const method = config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      // Dismiss any existing toasts first
      globalToastUtils.dismissAll();
      
      const successMessage = data?.message || this.getDefaultSuccessMessage(method);
      globalToastUtils.success(successMessage);
    }
  }

  /**
   * Handle API error responses
   */
  private handleErrorResponse(error: AxiosError): void {
    const { response, request, message } = error;
    
    let errorMessage = 'An unexpected error occurred';
    let errorDescription = '';

    if (response) {
      // Server responded with error status
      const { status, data } = response;
      
      // Type assertion for error response data
      const errorData = data as ErrorResponseData;
      
      errorMessage = errorData?.message || this.getDefaultErrorMessage(status);
      errorDescription = errorData?.description || '';

      // Handle specific status codes
      switch (status) {
        case 401:
          errorMessage = 'Session expired';
          errorDescription = 'Please sign in again';
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = 'Access forbidden';
          errorDescription = 'You do not have permission to perform this action';
          break;
        case 404:
          errorMessage = 'Resource not found';
          errorDescription = 'The requested resource could not be found';
          break;
        case 422:
          errorMessage = 'Validation error';
          errorDescription = errorData?.errors ? Object.values(errorData.errors).flat().join(', ') : '';
          break;
        case 500:
          errorMessage = 'Internal server error';
          errorDescription = 'Please try again later';
          break;
      }
    } else if (request) {
      // Network error - no response received
      errorMessage = 'Something went wrong';
      errorDescription = 'Please try again after 1 minute';
    } else {
      // Request setup error
      errorMessage = message || 'Request failed';
    }

    // Dismiss any existing toasts first
    globalToastUtils.dismissAll();
    
    // Show error toast
    globalToastUtils.error(errorMessage, errorDescription);
  }

  /**
   * Get default success message based on HTTP method
   */
  private getDefaultSuccessMessage(method: string): string {
    const messages = {
      POST: 'Data created successfully',
      PUT: 'Data updated successfully',
      PATCH: 'Data updated successfully',
      DELETE: 'Data deleted successfully',
    };
    return messages[method as keyof typeof messages] || 'Operation completed successfully';
  }

  /**
   * Get default error message based on status code
   */
  private getDefaultErrorMessage(status: number): string {
    const messages = {
      400: 'Bad request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not found',
      422: 'Validation failed',
      500: 'Internal server error',
    };
    return messages[status as keyof typeof messages] || 'Request failed';
  }
}
