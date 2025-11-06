import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';

// ============================================================================
// TIPOS
// ============================================================================

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

      toast({
        title: 'Contenido guardado',
        description: 'El contenido se ha guardado correctamente como borrador.',
      });

      return resultado;
    } catch (error: any) {
      toast({
        title: 'Error al guardar',
        description: error.message,
        variant: 'destructive',
      });
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

      toast({
        title: 'Contenido publicado',
        description:
          'El contenido se ha publicado. Futuras ediciones crearán versiones automáticamente.',
      });

      return resultado;
    } catch (error: any) {
      toast({
        title: 'Error al publicar',
        description: error.message,
        variant: 'destructive',
      });
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

      toast({
        title: 'Versión restaurada',
        description: 'Se ha restaurado la versión anterior correctamente.',
      });

      return resultado;
    } catch (error: any) {
      toast({
        title: 'Error al restaurar',
        description: error.message,
        variant: 'destructive',
      });
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
