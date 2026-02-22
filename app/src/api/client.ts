import axios from "axios";

export const api = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const msg =
      error.response?.data?.detail ?? error.message ?? "Request failed";
    console.error("[API]", msg);
    return Promise.reject(error);
  },
);
