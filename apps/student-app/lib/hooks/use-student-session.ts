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
  const defaultStudentId = process.env.NEXT_PUBLIC_DEFAULT_STUDENT_ID || null
  const defaultCohorteId =
    process.env.NEXT_PUBLIC_DEFAULT_COHORTE_ID ||
    process.env.NEXT_PUBLIC_DEFAULT_COHORT_ID ||
    null

  if (!enrollment) {
    if (defaultStudentId || defaultCohorteId) {
      return {
        estudianteId: defaultStudentId,
        cohorteId: defaultCohorteId,
        programId: null,
        isAuthenticated,
        isLoading: false,
      }
    }

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
