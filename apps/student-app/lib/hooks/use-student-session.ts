import { useAuth } from "../contexts/auth-context"

/**
 * Hook for managing student session data
 * Uses authentication context to provide student and cohort IDs
 */
interface StudentSession {
  estudianteId: string
  cohorteId: string
  programId: string
  isAuthenticated: boolean
  isLoading: boolean
}

export function useStudentSession(): StudentSession {
  const { enrollment, isAuthenticated, isLoading } = useAuth()

  // If no enrollment data available (e.g., during initial load or not logged in)
  // Fall back to environment variables for development
  if (!enrollment) {
    return {
      estudianteId: process.env.NEXT_PUBLIC_DEV_ESTUDIANTE_ID || "usuario:estudiante1",
      cohorteId: process.env.NEXT_PUBLIC_DEV_COHORTE_ID || "cohorte:cohorte1",
      programId: "programa:default",
      isAuthenticated: false,
      isLoading,
    }
  }

  return {
    estudianteId: enrollment.estudianteId,
    cohorteId: enrollment.cohorteId,
    programId: enrollment.programId,
    isAuthenticated,
    isLoading,
  }
}
