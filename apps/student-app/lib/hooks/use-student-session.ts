import { useAuth } from "../contexts/auth-context"

/**
 * Hook for managing student session data
 * Uses authentication context to provide student and cohort IDs
 */
interface StudentSession {
  estudianteId: string | null
  cohortId: string | null
  programId: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useStudentSession(): StudentSession {
  const { enrollment, isAuthenticated, isLoading, user } = useAuth()

  // Si hay enrollment, usarlo directamente
  if (enrollment) {
    return {
      estudianteId: enrollment.estudianteId,
      cohortId: enrollment.cohortId,
      programId: enrollment.programId,
      isAuthenticated,
      isLoading,
    }
  }

  // Si hay usuario autenticado con studentId, usarlo
  if (user?.studentId) {
    return {
      estudianteId: user.studentId,
      cohortId: null,
      programId: null,
      isAuthenticated,
      isLoading,
    }
  }

  // Solo usar variables de entorno si NO estamos autenticados y NO estamos cargando
  // Esto permite desarrollo sin login SOLO si explícitamente no hay sesión
  if (!isAuthenticated && !isLoading) {
    const defaultStudentId = process.env.NEXT_PUBLIC_DEFAULT_STUDENT_ID || null
    const defaultCohorteId =
      process.env.NEXT_PUBLIC_DEFAULT_COHORTE_ID ||
      process.env.NEXT_PUBLIC_DEFAULT_COHORT_ID ||
      null

    // Solo usar defaults si están configurados Y no contienen placeholders
    const useDefaults =
      defaultStudentId &&
      defaultCohorteId &&
      !defaultStudentId.includes("REEMPLAZAR") &&
      !defaultCohorteId.includes("REEMPLAZAR")

    if (useDefaults) {
      return {
        estudianteId: defaultStudentId,
        cohortId: defaultCohorteId,
        programId: null,
        isAuthenticated: false,
        isLoading: false,
      }
    }
  }

  // Si no hay nada, retornar vacío
  return {
    estudianteId: null,
    cohortId: null,
    programId: null,
    isAuthenticated,
    isLoading,
  }
}
