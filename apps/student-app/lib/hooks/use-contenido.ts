/**
 * @deprecated This hook is part of the legacy component system and will be removed.
 *
 * The platform has migrated from a 5-level hierarchy to a simplified 3-level hierarchy
 * with flexible exercise templates.
 *
 * **Replacement:** Use hooks from the new exercise system instead:
 * - For loading exercise content, use the new exercise instance hooks
 * - For AI generation, use the exercise generation endpoints
 *
 * **Migration Guide:** See /LEGACY_CLEANUP.md for detailed migration instructions.
 *
 * **Removal Date:** TBD (after frontend migration is complete)
 */

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * @deprecated Use ExerciseContent from the new exercise system instead
 */
export interface ComponenteContenido {
  id: string;
  tipo: 'leccion' | 'cuaderno' | 'simulacion' | 'herramienta';
  contenido: Record<string, any>;
  estado: 'draft' | 'publicado';
  created_at?: string;
}

export interface VersionContenido {
  id: string;
  numero_version: number;
  contenido_snapshot: Record<string, any>;
  cambios_descripcion: string;
  tipo_cambio: 'mayor' | 'menor' | 'patch' | 'revision';
  creado_por: string;
  created_at: string;
}

// ============================================================================
// HOOK: useContenido
// ============================================================================

/**
 * Hook para cargar el contenido actual de un componente.
 *
 * Uso:
 * ```tsx
 * const { contenido, isLoading, error } = useContenido(componenteId);
 * ```
 */
export function useContenido(componenteId: string | null) {
  const { data, error, isLoading } = useSWR<ComponenteContenido>(
    componenteId ? `/api/v1/componentes/${componenteId}/contenido` : null
  );

  return {
    contenido: data,
    isLoading,
    error,
  };
}

// ============================================================================
// HOOK: useGuardarContenido
// ============================================================================

/**
 * Hook para guardar el contenido de un componente con versionamiento automático.
 *
 * Uso:
 * ```tsx
 * const { guardarContenido, isGuardando } = useGuardarContenido(componenteId);
 *
 * await guardarContenido({ markdown: "...", palabras_estimadas: 500 });
 * ```
 */
export function useGuardarContenido(componenteId: string) {
  const [isGuardando, setIsGuardando] = useState(false);

  const guardarContenido = async (contenido: Record<string, any>) => {
    setIsGuardando(true);

    try {
      const response = await apiClient.put(
        `/componentes/${componenteId}/contenido`,
        { contenido }
      );
      const resultado = response.data;

      // Revalidar el contenido
      mutate(`/api/v1/componentes/${componenteId}/contenido`);

      toast.success('Contenido guardado correctamente como borrador.');

      return resultado;
    } catch (error: any) {
      toast.error(`Error al guardar: ${error.message}`);
      throw error;
    } finally {
      setIsGuardando(false);
    }
  };

  return {
    guardarContenido,
    isGuardando,
  };
}

// ============================================================================
// HOOK: usePublicarContenido
// ============================================================================

/**
 * Hook para publicar el contenido de un componente.
 *
 * Uso:
 * ```tsx
 * const { publicarContenido, isPublicando } = usePublicarContenido();
 *
 * await publicarContenido(componenteContenidoId);
 * ```
 */
export function usePublicarContenido() {
  const [isPublicando, setIsPublicando] = useState(false);

  const publicarContenido = async (componenteContenidoId: string) => {
    setIsPublicando(true);

    try {
      const response = await apiClient.post('/contenido/publicar', {
        componenteContenidoId,
      });
      const resultado = response.data;

      toast.success('Contenido publicado. Futuras ediciones crearán versiones automáticamente.');

      return resultado;
    } catch (error: any) {
      toast.error(`Error al publicar: ${error.message}`);
      throw error;
    } finally {
      setIsPublicando(false);
    }
  };

  return {
    publicarContenido,
    isPublicando,
  };
}

// ============================================================================
// HOOK: useHistorialVersiones
// ============================================================================

/**
 * Hook para obtener el historial de versiones de un componente.
 *
 * Uso:
 * ```tsx
 * const { versiones, isLoading } = useHistorialVersiones(componenteId);
 * ```
 */
export function useHistorialVersiones(componenteId: string | null) {
  const { data, error, isLoading } = useSWR<VersionContenido[]>(
    componenteId ? `/api/v1/contenido/historial/${componenteId}` : null
  );

  return {
    versiones: data || [],
    isLoading,
    error,
  };
}

// ============================================================================
// HOOK: useRestaurarVersion
// ============================================================================

/**
 * Hook para restaurar una versión anterior del contenido.
 *
 * Uso:
 * ```tsx
 * const { restaurarVersion, isRestaurando } = useRestaurarVersion();
 *
 * await restaurarVersion(componenteId, versionId, "Rollback por error");
 * ```
 */
export function useRestaurarVersion() {
  const [isRestaurando, setIsRestaurando] = useState(false);

  const restaurarVersion = async (
    componenteId: string,
    versionId: string,
    razon?: string
  ) => {
    setIsRestaurando(true);

    try {
      const response = await apiClient.post('/contenido/restaurar', {
        componenteId,
        versionId,
        razon,
      });
      const resultado = response.data;

      // Revalidar el contenido y el historial
      mutate(`/api/v1/componentes/${componenteId}/contenido`);
      mutate(`/api/v1/contenido/historial/${componenteId}`);

      toast.success('Versión restaurada correctamente.');

      return resultado;
    } catch (error: any) {
      toast.error(`Error al restaurar: ${error.message}`);
      throw error;
    } finally {
      setIsRestaurando(false);
    }
  };

  return {
    restaurarVersion,
    isRestaurando,
  };
}
