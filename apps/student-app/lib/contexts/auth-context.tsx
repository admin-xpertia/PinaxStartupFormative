"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { enrollmentsApi, studentsApi } from "@/services/api"

/**
 * User information from JWT token or API
 */
export interface User {
  id: string
  email: string
  nombre: string
  rol: string
  studentId?: string
}

/**
 * Student enrollment information
 */
export interface StudentEnrollment {
  estudianteId: string
  cohortId: string
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

  const resolveStudentIdByUser = useCallback(async (userId: string) => {
    try {
      const profile = await studentsApi.getByUserId(userId)
      return profile.id
    } catch (error) {
      console.error("No se pudo obtener el estudiante para el usuario", error)
      return null
    }
  }, [])

  const fetchStudentEnrollment = useCallback(
    async (studentId: string) => {
      try {
        const enrollments = await enrollmentsApi.getMy(studentId)
        const activeEnrollment = enrollments.find((enrollment) => enrollment.status === "active") ?? enrollments[0]

        if (!activeEnrollment) {
          setEnrollment(null)
          localStorage.removeItem("student_enrollment")
          return
        }

        const enrollmentData: StudentEnrollment = {
          estudianteId: activeEnrollment.studentId,
          cohortId: activeEnrollment.cohortId,
          programId: activeEnrollment.programId,
          programName: activeEnrollment.programName,
        }

        setEnrollment(enrollmentData)
        localStorage.setItem("student_enrollment", JSON.stringify(enrollmentData))
      } catch (error) {
        console.error("Failed to fetch enrollment:", error)
        setEnrollment(null)
      }
    },
    [],
  )

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("auth_token")
        const storedUser = localStorage.getItem("auth_user")
        const storedEnrollment = localStorage.getItem("student_enrollment")

        if (storedToken && storedUser) {
          let parsedUser = JSON.parse(storedUser) as User
          setToken(storedToken)

          if (parsedUser.rol === "estudiante" && !parsedUser.studentId) {
            const restoredStudentId = await resolveStudentIdByUser(parsedUser.id)
            if (restoredStudentId) {
              parsedUser = { ...parsedUser, studentId: restoredStudentId }
              localStorage.setItem("auth_user", JSON.stringify(parsedUser))
            }
          }

          setUser(parsedUser)

          if (storedEnrollment) {
            setEnrollment(JSON.parse(storedEnrollment))
          } else if (parsedUser.rol === "estudiante" && parsedUser.studentId) {
            await fetchStudentEnrollment(parsedUser.studentId)
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
  }, [fetchStudentEnrollment, resolveStudentIdByUser])

  // Login function
  const login = useCallback(
    async (email: string, password: string) => {
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

        const resolvedStudentId =
          data.user.studentId ?? (await resolveStudentIdByUser(data.user.id))
        const userPayload: User =
          resolvedStudentId && data.user.rol === "estudiante"
            ? { ...data.user, studentId: resolvedStudentId }
            : data.user

        // Store token and user
        setToken(data.token)
        setUser(userPayload)
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("auth_user", JSON.stringify(userPayload))

        // Fetch student enrollment if user is a student
        if (resolvedStudentId && data.user.rol === "estudiante") {
          await fetchStudentEnrollment(resolvedStudentId)
        }
      } catch (error) {
        console.error("Login error:", error)
        throw error
      }
    },
    [resolveStudentIdByUser, fetchStudentEnrollment],
  )

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
  const refreshUser = useCallback(
    async () => {
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
        const studentId =
          data.studentId ??
          (data.rol === "estudiante" ? await resolveStudentIdByUser(data.id) : null)
        const userPayload: User =
          studentId && data.rol === "estudiante"
            ? { ...data, studentId }
            : data

        setUser(userPayload)
        localStorage.setItem("auth_user", JSON.stringify(userPayload))

        if (studentId && data.rol === "estudiante" && !enrollment) {
          await fetchStudentEnrollment(studentId)
        }
      } catch (error) {
        console.error("Failed to refresh user:", error)
        logout()
      }
    },
    [token, logout, resolveStudentIdByUser, enrollment, fetchStudentEnrollment],
  )

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
