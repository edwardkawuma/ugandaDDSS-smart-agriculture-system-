import axios from 'axios';

/** Dedicated client for real backend auth — bypasses mock adapter. */
export const authClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

authClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message ?? 'Authentication failed';
    return Promise.reject(new Error(message));
  },
);

export const mapsClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

export const syncClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10000,
  headers: { Accept: 'application/json' },
});
