/**
 * Exercises API Service
 * Handles exercise templates and instances
 */

import { apiClient } from './client'
import type {
  ExerciseTemplateResponse,
  ExerciseInstanceResponse,
  AddExerciseToProofPointRequest,
  ExerciseCategory,
} from '@/types/api'

// ============================================================================
// Exercise Templates (Catalog)
// ============================================================================

export const exerciseTemplatesApi = {
  /**
   * Get all active exercise templates
   */
  getAll: () =>
    apiClient.get<ExerciseTemplateResponse[]>('/exercise-templates'),

  /**
   * Get exercise template by ID
   */
  getById: (id: string) =>
    apiClient.get<ExerciseTemplateResponse>(`/exercise-templates/${id}`),

  /**
   * Get templates by category
   */
  getByCategory: (categoria: ExerciseCategory) =>
    apiClient.get<ExerciseTemplateResponse[]>(
      `/exercise-templates?categoria=${categoria}`
    ),

  /**
   * Get only official templates
   */
  getOfficial: () =>
    apiClient.get<ExerciseTemplateResponse[]>(
      '/exercise-templates?esOficial=true'
    ),
}

// ============================================================================
// Exercise Instances
// ============================================================================

export const exerciseInstancesApi = {
  /**
   * Get all exercises for a proof point
   */
  getByProofPoint: (proofPointId: string) =>
    apiClient.get<ExerciseInstanceResponse[]>(
      `/proof-points/${proofPointId}/exercises`
    ),

  /**
   * Get exercise instance by ID
   */
  getById: (id: string) =>
    apiClient.get<ExerciseInstanceResponse>(`/exercises/${id}`),

  /**
   * Add exercise to proof point
   */
  create: (proofPointId: string, data: AddExerciseToProofPointRequest) =>
    apiClient.post<ExerciseInstanceResponse>(
      `/proof-points/${proofPointId}/exercises`,
      data
    ),

  /**
   * Update exercise instance
   */
  update: (id: string, data: Partial<AddExerciseToProofPointRequest>) =>
    apiClient.put<ExerciseInstanceResponse>(`/exercises/${id}`, data),

  /**
   * Delete exercise instance
   */
  delete: (id: string) => apiClient.delete<void>(`/exercises/${id}`),

  /**
   * Reorder exercises in a proof point
   */
  reorder: (proofPointId: string, exerciseIds: string[]) =>
    apiClient.put<ExerciseInstanceResponse[]>(
      `/proof-points/${proofPointId}/exercises/reorder`,
      { exerciseIds }
    ),

  /**
   * Generate content for exercise
   */
  generateContent: (id: string, forceRegenerate?: boolean) =>
    apiClient.post<ExerciseInstanceResponse>(
      `/exercises/${id}/generate`,
      { forceRegenerate }
    ),
}

// ============================================================================
// Exercise Categories Metadata
// ============================================================================

export const exerciseCategoriesMetadata: Record<
  ExerciseCategory,
  {
    nombre: string
    icono: string
    color: string
    descripcionCorta: string
  }
> = {
  leccion_interactiva: {
    nombre: 'Lección Interactiva',
    icono: '📖',
    color: '#6366f1',
    descripcionCorta: 'Transmitir conocimiento conceptual de manera activa',
  },
  cuaderno_trabajo: {
    nombre: 'Cuaderno de Trabajo',
    icono: '📝',
    color: '#8b5cf6',
    descripcionCorta: 'Ejercicios estructurados con retroalimentación inmediata',
  },
  simulacion_interaccion: {
    nombre: 'Simulación de Interacción',
    icono: '💬',
    color: '#ec4899',
    descripcionCorta: 'Practicar conversaciones y situaciones del mundo real',
  },
  mentor_asesor_ia: {
    nombre: 'Mentor y Asesor IA',
    icono: '🤖',
    color: '#06b6d4',
    descripcionCorta: 'Guía personalizada y feedback continuo',
  },
  herramienta_analisis: {
    nombre: 'Herramienta de Análisis',
    icono: '🔍',
    color: '#10b981',
    descripcionCorta: 'Evaluar y obtener feedback sobre trabajo existente',
  },
  herramienta_creacion: {
    nombre: 'Herramienta de Creación',
    icono: '🎨',
    color: '#f59e0b',
    descripcionCorta: 'Generar artefactos guiados por IA',
  },
  sistema_tracking: {
    nombre: 'Sistema de Tracking',
    icono: '📊',
    color: '#3b82f6',
    descripcionCorta: 'Monitorear progreso y hábitos de aprendizaje',
  },
  herramienta_revision: {
    nombre: 'Herramienta de Revisión',
    icono: '✅',
    color: '#14b8a6',
    descripcionCorta: 'Revisión y mejora iterativa de entregables',
  },
  simulador_entorno: {
    nombre: 'Simulador de Entorno',
    icono: '🌐',
    color: '#6366f1',
    descripcionCorta: 'Entorno virtual para practicar sin riesgos',
  },
  sistema_progresion: {
    nombre: 'Sistema de Progresión',
    icono: '🎯',
    color: '#a855f7',
    descripcionCorta: 'Desbloqueables y reconocimiento de logros',
  },
}
