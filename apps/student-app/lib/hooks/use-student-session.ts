import { useAuth } from "../contexts/auth-context"

/**
 * Hook for managing student session data
 * Uses authentication context to provide student and cohort IDs
 */
interface StudentSession {
  estudianteId: string | null
  cohorteId: string | null
  programId: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useStudentSession(): StudentSession {
  const { enrollment, isAuthenticated, isLoading } = useAuth()

  if (!enrollment) {
    return {
      estudianteId: null,
      cohorteId: null,
      programId: null,
      isAuthenticated,
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
