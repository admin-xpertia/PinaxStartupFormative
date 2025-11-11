import { useEffect, useRef, useCallback } from "react"
import { progressApi } from "@/services/api"

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

  const save = useCallback(async () => {
    if (isSavingRef.current) return

    const currentData = JSON.stringify(data)

    // Solo guardar si hay cambios
    if (currentData === lastSavedData.current) return

    isSavingRef.current = true

    try {
      await progressApi.autoSave(exerciseId, data)
      lastSavedData.current = currentData
      onSave?.()
    } catch (error) {
      console.error("Auto-save error:", error)
      onError?.(error)
    } finally {
      isSavingRef.current = false
    }
  }, [exerciseId, data, onSave, onError])

  // Auto-save con debounce
  useEffect(() => {
    if (!enabled) return

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
  }, [data, enabled, interval, save])

  // Save manual
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    await save()
  }, [save])

  return { saveNow }
}
