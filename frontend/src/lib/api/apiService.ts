// language: TypeScript
// file_name: apiService.ts
// file_path: src/lib/api/apiService.ts
// description: This file contains the main ApiService class which orchestrates all API functionality.

// Imports
import { Env } from '@/constants/Env';
import { HttpMethods } from './httpMethods';
import axios, { AxiosInstance } from 'axios';
import { ApiInterceptors } from './interceptors';
import { ApiError, ApiResponse, ApiServiceConfig, ErrorResponseData } from './interfaces/api.interface';

/**
 * Common API Service Class
 * Handles all HTTP requests with interceptors for error handling and toast notifications
 */
class ApiService {
  private axiosInstance: AxiosInstance;
  private interceptors: ApiInterceptors;
  private httpMethods: HttpMethods;

  constructor(config: ApiServiceConfig) {

    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: Env.network.base_url,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // Initialize interceptors and HTTP methods
    this.interceptors = new ApiInterceptors(this.axiosInstance);
    this.httpMethods = new HttpMethods(this.axiosInstance);

    // Setup interceptors
    this.interceptors.setupInterceptors();
  }

  /**
   * GET request
   * @param endpoint - API endpoint
   * @param params required parameter, in case no params are needed, pass an empty object {}
   * @returns Promise with API response
   */
  async get<T = unknown>(options: { endpoint: string, params: object }): Promise<T> {
    return this.httpMethods.get<T>(options.endpoint, options.params);
  }

  /**
   * POST request
   * @param endpoint - API endpoint
   * @param data - Request payload in case no data is needed, pass an empty object {}
   * @returns Promise with API response
   */
  async post<T = unknown>(options: { endpoint: string, data: object }): Promise<T> {
    return this.httpMethods.post<T>(options.endpoint, options.data);
  }

  /**
   * PUT request
   * @param endpoint - API endpoint
   * @param data - Request payload in case no data is needed, pass an empty object {}
   * @returns Promise with API response
   */
  async put<T = unknown>(options: { endpoint: string, data: object }): Promise<T> {
    return this.httpMethods.put<T>(options.endpoint, options.data);
  }

  /**
   * PATCH request
   * @param endpoint - API endpoint
   * @param data - Request payload in case no data is needed, pass an empty object {}
   * @returns Promise with API response
   */
  async patch<T = unknown>(options: { endpoint: string, data: object }): Promise<T> {
    return this.httpMethods.patch<T>(options.endpoint, options.data);
  }

  /**
   * DELETE request
   * @param endpoint - API endpoint
   * @param config - Axios request configuration
   * @returns Promise with API response
   */
  async delete<T = unknown>(options: { endpoint: string, data: object }): Promise<T> {
    return this.httpMethods.delete<T>(options.endpoint, options.data);
  }

  /**
   * Upload file
   * @param url - API endpoint
   * @param file - File to upload
   * @param onProgress - Progress callback
   * @returns Promise with API response
   */
  async uploadFile<T = unknown>(
    endpoint: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    return this.httpMethods.uploadFile<T>(endpoint, file, onProgress);
  }

  /**
   * Update base URL
   * @param newBaseURL - New base URL
   */
  updateBaseURL(newBaseURL: string): void {
    this.axiosInstance.defaults.baseURL = newBaseURL;
  }

  /**
   * Install a custom axios adapter (used by the mock layer in dev / preview mode).
   * Pass `null` to revert to the default network adapter.
   */
  installAdapter(adapter: ((config: any) => Promise<any>) | null): void {
    this.axiosInstance.defaults.adapter = adapter ?? undefined;
  }
}

// Create and export default API service instance
const apiService = new ApiService({
  baseURL: Env.network.base_url,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
  },
});

// Export the class for custom instances
export { ApiService, apiService, type ApiServiceConfig, type ApiResponse, type ApiError, type ErrorResponseData };

// Export default instance
export default apiService;