/**
 * Hook for managing student session data
 *
 * In a real application, this would retrieve data from:
 * - Authentication context
 * - JWT token claims
 * - Session storage
 * - Backend session endpoint
 *
 * For now, it returns temporary hardcoded values until proper auth is implemented.
 * TODO: Replace with real authentication context when implemented
 */

interface StudentSession {
  estudianteId: string
  cohorteId: string
  isAuthenticated: boolean
}

export function useStudentSession(): StudentSession {
  // TODO: Replace with real authentication
  // This should eventually come from an auth context or JWT token
  // For example:
  // const { user } = useAuth()
  // return {
  //   estudianteId: user.id,
  //   cohorteId: user.activeCohorteId,
  //   isAuthenticated: !!user
  // }

  // Temporary: Read from environment or use fixed values for development
  const estudianteId = process.env.NEXT_PUBLIC_DEV_ESTUDIANTE_ID || "usuario:estudiante1"
  const cohorteId = process.env.NEXT_PUBLIC_DEV_COHORTE_ID || "cohorte:cohorte1"

  return {
    estudianteId,
    cohorteId,
    isAuthenticated: true,
  }
}
