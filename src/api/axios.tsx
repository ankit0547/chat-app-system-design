// src/utils/axiosInstance.js
import axios from "axios";

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL, // Replace with your API base URL
  timeout: 10000, // Set a timeout limit
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the access token
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor (optional)
axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lies within the range of 2xx will cause this function to trigger
    return response.data;
  },
  async (error) => {
    // Any status codes that fall outside the range of 2xx will cause this function to trigger
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const apiEndpoint = import.meta.env.VITE_APP_API_URL;
        const endPoint = `${apiEndpoint}/user/refresh-token`;
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(endPoint, { refreshToken });
        const newAccessToken = response.data.data.accessToken;
        const newRefreshToken = response.data.data.refreshToken;
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        // Set the new access token in the original request headers
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        // Retry the original request with the new access token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token expired or invalid:", refreshError);
        // Optionally, handle logout or redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    }
    return Promise.reject(error.response.data);
  }
);

export default axiosInstance;
