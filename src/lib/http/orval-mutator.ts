import axios, { type AxiosRequestConfig } from "axios";

/**
 * Transport adapter used only by generated Orval functions.
 * Application code consumes the domain API facade instead of this function.
 */
export async function orvalMutator<T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> {
  const response = await axios.request<T>({ ...config, ...options });
  return response.data;
}

