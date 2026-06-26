// language: TypeScript
// file_name: httpMethods.ts
// file_path: src/lib/api/httpMethods.ts
// description: This file contains the HttpMethods class which contains all the REST API methods.

// Imports
import { AxiosInstance } from 'axios';

/**
 * HTTP Methods class containing all REST API methods
 */
export class HttpMethods {
  constructor(private axiosInstance: AxiosInstance) { }

  /**
   * GET request
   * @param url - API endpoint
   * @param params - params is a required parameter in case no params are needed, pass an empty object {}
   * @returns Promise with API response
   */
  async get<T = unknown>(url: string, params: object): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, { params });
    return response.data;
  }

  /**
   * POST request
   * @param url - API endpoint
   * @param data - data is a required parameter in case no params are needed, pass an empty object {}
   * @returns Promise with API response
   */
  async post<T = unknown>(url: string, data: object): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data);
    return response.data;
  }

  /**
   * PUT request
   * @param url - API endpoint
   * @param data - data is a required parameter in case no params are needed, pass an empty object {}
   * @returns Promise with API response
   */
  async put<T = unknown>(url: string, data: object): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data);
    return response.data;
  }

  /**
   * PATCH request
   * @param url - API endpoint
   * @param data - data is a required parameter in case no params are needed, pass an empty object {}
   * @returns Promise with API response
   */
  async patch<T = unknown>(url: string, data: object): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data);
    return response.data;
  }

  /**
   * DELETE request
   * @param url - API endpoint
   * @param data - data is a required parameter in case no params are needed, pass an empty object {}
   * @returns Promise with API response
   */
  async delete<T = unknown>(url: string, data: object): Promise<T> {
    // Backend codegen defaults DELETE to @Query() (planner request_type: "query"),
    // so we send params on the URL, not in the body. Sending as { data } would
    // leave req.query empty and any @IsUUID/@IsNotEmpty validator on the id
    // would throw "id must be a UUID".
    const response = await this.axiosInstance.delete<T>(url, { params: data });
    return response.data;
  }

  /**
   * Upload file
   * @param url - API endpoint
   * @param file - File to upload
   * @param onProgress - Progress callback
   * @returns Promise with API response
   */
  async uploadFile<T = unknown>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.axiosInstance.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  }
}