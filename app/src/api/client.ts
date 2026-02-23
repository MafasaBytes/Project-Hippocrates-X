import axios from "axios";
import { notifications } from "@mantine/notifications";

// Create API client
export const api = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // 30 second timeout
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    // In production, get token from auth store/session
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("[Request Error]", error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't show errors for cancelled requests
    if (axios.isCancel(error) || !error.config) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    const msg = detail ?? error.message ?? "Request failed";

    // Log error details (without PII)
    console.error("[API Error]", {
      url: error.config?.url,
      method: error.config?.method,
      status,
      // Note: Don't log sensitive data like patient info
    });

    // Don't show notifications for GET requests during loading states
    // or for 401/403 which are handled by auth interceptors
    if (status === 401 || status === 403) {
      // Auth error - redirect to login would happen here in production
      localStorage.removeItem("auth_token");
      // window.location.href = "/login"; // In production
      return Promise.reject(error);
    }

    // Show notification for non-GET errors or important operations
    const isGetRequest = error.config?.method?.toLowerCase() === "get";
    const isNetworkError = !error.response;

    if (!isGetRequest || isNetworkError) {
      notifications.show({
        title: status === 500 ? "Server Error" : "Request Failed",
        message: msg,
        color: status === 422 ? "yellow" : "red",
      });
    }

    // Return structured error for components to handle
    return Promise.reject({
      message: msg,
      status,
      detail,
      retryable: [408, 429, 502, 503, 504].includes(status),
      code: error.code,
    });
  }
);

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  // Limit length
  const MAX_LENGTH = 10000;
  let sanitized = input.substring(0, MAX_LENGTH);

  // Remove script tags
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, "");
  sanitized = sanitized.replace(/<script[^>]*>/gi, "");

  // Remove event handlers
  sanitized = sanitized.replace(/\son\w+="[^"]*"/gi, "");
  sanitized = sanitized.replace(/\son\w+='[^']*'/gi, "");

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, "");

  return sanitized.trim();
}

/**
 * Validate file type and size
 */
export function validateFile(file: File, maxFileSize: number = 50 * 1024 * 1024): boolean {
  // Check file size
  if (file.size > maxFileSize) {
    return false;
  }

  // Define allowed MIME types
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/json",
    "audio/wav",
    "audio/mpeg",
    "audio/flac",
    "audio/ogg",
    "video/mp4",
    "video/webm",
    "application/dicom", // DICOM files
  ];

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return false;
  }

  return true;
}

/**
 * Get retry delay based on attempt number (exponential backoff)
 */
export function getRetryDelay(attempt: number): number {
  const baseDelay = 1000; // 1 second
  return Math.min(baseDelay * Math.pow(2, attempt), 10000); // Max 10 seconds
}
