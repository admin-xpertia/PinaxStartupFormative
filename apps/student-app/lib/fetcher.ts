/**
 * Fetcher function for useSWR
 * Handles authentication tokens and error responses
 */

export class ApiError extends Error {
  info: any
  status: number

  constructor(message: string, status: number, info?: any) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.info = info
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  // Get auth token from localStorage if available
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, {
    headers,
  })

  // Handle non-OK responses
  if (!res.ok) {
    let errorInfo: any

    try {
      errorInfo = await res.json()
    } catch {
      errorInfo = { message: res.statusText }
    }

    const error = new ApiError(
      errorInfo.message || `Error ${res.status}: ${res.statusText}`,
      res.status,
      errorInfo,
    )

    throw error
  }

  return res.json()
}

/**
 * Fetcher for POST/PUT/PATCH requests
 */
export async function mutationFetcher<T>(url: string, { arg }: { arg: any }): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(arg),
  })

  if (!res.ok) {
    let errorInfo: any

    try {
      errorInfo = await res.json()
    } catch {
      errorInfo = { message: res.statusText }
    }

    const error = new ApiError(
      errorInfo.message || `Error ${res.status}: ${res.statusText}`,
      res.status,
      errorInfo,
    )

    throw error
  }

  return res.json()
}
