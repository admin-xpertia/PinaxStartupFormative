/**
 * API Client Configuration
 * Base configuration for all API calls
 */

// Si NEXT_PUBLIC_API_URL ya incluye /api/v1, no agregar prefix
// Si es solo la URL base, agregar /api/v1
const configuredUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const API_BASE_URL = configuredUrl.endsWith('/api/v1') ? configuredUrl : `${configuredUrl}/api/v1`

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

class ApiClientError extends Error {
  statusCode: number
  error?: string

  constructor(message: string, statusCode: number, error?: string) {
    super(message)
    this.name = 'ApiClientError'
    this.statusCode = statusCode
    this.error = error
  }
}

/**
 * Get auth token from localStorage
 * TODO: Replace with actual auth implementation
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: response.statusText,
      statusCode: response.status,
    }))

    throw new ApiClientError(
      errorData.message || 'API request failed',
      response.status,
      errorData.error
    )
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export const apiClient = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data?: any) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: any) =>
    apiFetch<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: any) =>
    apiFetch<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'DELETE' }),
}

export { ApiClientError }
