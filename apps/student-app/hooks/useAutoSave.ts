import { useEffect, useRef, useCallback } from "react"
import { progressApi } from "@/services/api"
import type { SaveProgressParams } from "@/services/api"
import { useStudentSession } from "@/lib/hooks/use-student-session"

interface UseAutoSaveOptions {
  exerciseId: string
  data: any
  enabled?: boolean
  interval?: number // milliseconds, default 10000 (10s)
  onSave?: () => void
  onError?: (error: any) => void
}

/**
 * Hook para auto-guardar progreso del ejercicio
 * Guarda automáticamente cada X segundos si hay cambios
 */
export function useAutoSave({
  exerciseId,
  data,
  enabled = true,
  interval = 10000,
  onSave,
  onError,
}: UseAutoSaveOptions) {
  const lastSavedData = useRef<string>("")
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isSavingRef = useRef(false)
  const { estudianteId, cohortId } = useStudentSession()

  const ensureRecord = useCallback((value: any): Record<string, any> => {
    if (value && typeof value === "object") {
      return value as Record<string, any>
    }
    if (value === undefined || value === null) {
      return {}
    }
    return { value }
  }, [])

  const buildPayload = useCallback((): SaveProgressParams | null => {
    if (!estudianteId || !cohortId) {
      return null
    }

    if (data && typeof data === "object") {
      const {
        datos,
        porcentajeCompletitud,
        tiempoInvertidoMinutos,
        estudianteId: payloadEstudianteId,
        cohorteId: payloadCohorteId,
        ...rest
      } = data as Record<string, any>

      return {
        estudianteId: (payloadEstudianteId as string) ?? estudianteId,
        cohorteId: (payloadCohorteId as string) ?? cohortId,
        datos: ensureRecord(datos ?? rest),
        porcentajeCompletitud:
          typeof porcentajeCompletitud === "number" ? porcentajeCompletitud : undefined,
        tiempoInvertidoMinutos:
          typeof tiempoInvertidoMinutos === "number" ? tiempoInvertidoMinutos : undefined,
      }
    }

    return {
      estudianteId,
      cohorteId: cohortId,
      datos: ensureRecord(data),
    }
  }, [cohortId, data, ensureRecord, estudianteId])

  const save = useCallback(async () => {
    if (isSavingRef.current) return

    const currentData = JSON.stringify(data)

    // Solo guardar si hay cambios
    if (currentData === lastSavedData.current) return

    const payload = buildPayload()
    if (!payload) return

    isSavingRef.current = true

    try {
      await progressApi.autoSave(exerciseId, payload)
      lastSavedData.current = currentData
      onSave?.()
    } catch (error) {
      console.error("Auto-save error:", error)
      onError?.(error)
    } finally {
      isSavingRef.current = false
    }
  }, [buildPayload, data, exerciseId, onError, onSave])

  // Auto-save con debounce
  useEffect(() => {
    if (!enabled) return
    if (!buildPayload()) return

    // Clear timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Schedule nuevo save
    saveTimeoutRef.current = setTimeout(() => {
      save()
    }, interval)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [buildPayload, data, enabled, interval, save])

  // Save manual
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    await save()
  }, [save])

  return { saveNow }
}
