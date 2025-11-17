"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { enrollmentsApi } from "@/services/api"

/**
 * User information from JWT token or API
 */
export interface User {
  id: string
  email: string
  nombre: string
  rol: string
}

/**
 * Student enrollment information
 */
export interface StudentEnrollment {
  estudianteId: string
  cohorteId: string
  programId: string
  programName: string
}

/**
 * Authentication context state
 */
export interface AuthContextType {
  // User authentication
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Student-specific data
  enrollment: StudentEnrollment | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Auth Provider Component
 * Manages authentication state and provides it to the app
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [enrollment, setEnrollment] = useState<StudentEnrollment | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("auth_token")
        const storedUser = localStorage.getItem("auth_user")
        const storedEnrollment = localStorage.getItem("student_enrollment")

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))

          if (storedEnrollment) {
            setEnrollment(JSON.parse(storedEnrollment))
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error)
        // Clear invalid data
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
        localStorage.removeItem("student_enrollment")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      const baseUrl = apiUrl.endsWith("/api/v1") ? apiUrl : `${apiUrl}/api/v1`

      const response = await fetch(`${baseUrl}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Login failed")
      }

      const data = await response.json()

      // Store token and user
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("auth_user", JSON.stringify(data.user))

      // Fetch student enrollment if user is a student
      if (data.user.rol === "estudiante") {
        await fetchStudentEnrollment(data.user.id)
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }, [])

  // Fetch student enrollment information
  const fetchStudentEnrollment = async (userId: string) => {
    try {
      const enrollments = await enrollmentsApi.getMy(userId)
      const activeEnrollment = enrollments.find((enrollment) => enrollment.status === "active") ?? enrollments[0]

      if (!activeEnrollment) {
        setEnrollment(null)
        localStorage.removeItem("student_enrollment")
        return
      }

      const enrollmentData: StudentEnrollment = {
        estudianteId: activeEnrollment.studentId,
        cohorteId: activeEnrollment.cohortId,
        programId: activeEnrollment.programId,
        programName: activeEnrollment.programName,
      }

      setEnrollment(enrollmentData)
      localStorage.setItem("student_enrollment", JSON.stringify(enrollmentData))
    } catch (error) {
      console.error("Failed to fetch enrollment:", error)
      setEnrollment(null)
    }
  }

  // Logout function
  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setEnrollment(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    localStorage.removeItem("student_enrollment")
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!token) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      const baseUrl = apiUrl.endsWith("/api/v1") ? apiUrl : `${apiUrl}/api/v1`

      const response = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to refresh user")
      }

      const data = await response.json()
      setUser(data)
      localStorage.setItem("auth_user", JSON.stringify(data))
    } catch (error) {
      console.error("Failed to refresh user:", error)
      logout()
    }
  }, [token, logout])

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    enrollment,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use auth context
 * Must be used within AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
