// API Client para Student App
// Conecta con el backend compartido en el bounded context de estudiantes

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message)
    this.name = "APIError"
  }
}

// Configuración de la URL base
const configuredUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
const API_BASE_URL = configuredUrl.endsWith("/api/v1")
  ? configuredUrl
  : `${configuredUrl}/api/v1`

/**
 * Get authentication token from localStorage
 * This is accessed by the API client to include in requests
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  }

  // Add authentication token if available
  const token = getAuthToken()
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new APIError(
        response.status,
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        errorData
      )
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return await response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }

    throw new APIError(
      500,
      error instanceof Error ? error.message : "Unknown error occurred"
    )
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
}
