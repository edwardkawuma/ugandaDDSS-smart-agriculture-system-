/**
 * API Service Configuration Interface
 */
export interface ApiServiceConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
  }
  
  /**
   * API Response Interface
   */
  export interface ApiResponse<T = unknown> {
    success: boolean;
    status: number;
    data?: T;
  }
  
  /**
   * API Error Interface
   */
  export interface ApiError {
    message: string;
    status?: number;
    code?: string;
  }
  
  /**
   * Error Response Data Interface
   */
  export interface ErrorResponseData {
    message?: string;
    description?: string;
    errors?: Record<string, string[]>;
  }
  
  /**
   * Success Response Data Interface
   */
  export interface SuccessResponseData {
    message?: string;
    data?: unknown;
  }