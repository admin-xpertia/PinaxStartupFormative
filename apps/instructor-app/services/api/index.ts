/**
 * API Services Index
 * Central export for all API services
 */

export { apiClient, ApiClientError } from './client'
export { programsApi } from './programs'
export { fasesApi } from './fases'
export { proofPointsApi } from './proof-points'
export { cohortsApi } from './cohorts'
export {
  exerciseTemplatesApi,
  exerciseInstancesApi,
  exerciseCategoriesMetadata,
} from './exercises'

// Re-export types for convenience
export type * from '@/types/api'
