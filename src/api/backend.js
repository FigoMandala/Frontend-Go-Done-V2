// src/api/backend.js
import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const apiBaseUrl = normalizedBaseUrl.endsWith("/api")
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api`;
const REQUEST_TIMEOUT_MS = 20000;

const backend = axios.create({
  baseURL: apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
});

// Inject Authorization header
backend.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

backend.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem("token");
    }
    return Promise.reject(err);
  }
);

export default backend;
