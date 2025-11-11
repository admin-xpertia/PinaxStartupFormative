import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

// ============================================================================
// TIPOS
// ============================================================================

export interface PromptTemplate {
  id: string;
  nombre: string;
  descripcion: string;
  tipo_componente: 'leccion' | 'cuaderno' | 'simulacion' | 'herramienta';
  prompt_template: string;
  config_default: Record<string, any>;
  autor: string;
  es_oficial: boolean;
  creador: string;
  created_at: string;
}

export interface CrearPlantillaDto {
  nombre: string;
  descripcion: string;
  tipoComponente: 'leccion' | 'cuaderno' | 'simulacion' | 'herramienta';
  promptTemplate: string;
  configDefault?: Record<string, any>;
  autor?: string;
  esOficial?: boolean;
}

export interface FiltrosPlantillas {
  tipoComponente?: 'leccion' | 'cuaderno' | 'simulacion' | 'herramienta';
  esOficial?: boolean;
}

// ============================================================================
// HOOK: usePromptTemplates
// ============================================================================

/**
 * Hook para obtener la lista de plantillas de prompts con filtros opcionales.
 *
 * Uso:
 * ```tsx
 * const { plantillas, isLoading, error } = usePromptTemplates({
 *   tipoComponente: 'leccion',
 *   esOficial: true
 * });
 * ```
 */
export function usePromptTemplates(filtros?: FiltrosPlantillas) {
  // Construir query string
  const queryParams = new URLSearchParams();
  if (filtros?.tipoComponente) {
    queryParams.append('tipoComponente', filtros.tipoComponente);
  }
  if (filtros?.esOficial !== undefined) {
    queryParams.append('esOficial', filtros.esOficial.toString());
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `/api/v1/prompt-templates?${queryString}`
    : '/api/v1/prompt-templates';

  const { data, error, isLoading } = useSWR<PromptTemplate[]>(url);

  return {
    plantillas: data || [],
    isLoading,
    error,
  };
}

// ============================================================================
// HOOK: usePromptTemplate
// ============================================================================

/**
 * Hook para obtener una plantilla específica por ID.
 *
 * Uso:
 * ```tsx
 * const { plantilla, isLoading, error } = usePromptTemplate(plantillaId);
 * ```
 */
export function usePromptTemplate(plantillaId: string | null) {
  const { data, error, isLoading } = useSWR<PromptTemplate>(
    plantillaId ? `/api/v1/prompt-templates/${plantillaId}` : null
  );

  return {
    plantilla: data,
    isLoading,
    error,
  };
}

// ============================================================================
// HOOK: useCrearPlantilla
// ============================================================================

/**
 * Hook para crear una nueva plantilla de prompt.
 *
 * Uso:
 * ```tsx
 * const { crearPlantilla, isCreando } = useCrearPlantilla();
 *
 * await crearPlantilla({
 *   nombre: "Lección de Introducción",
 *   descripcion: "Plantilla para lecciones introductorias",
 *   tipoComponente: "leccion",
 *   promptTemplate: "Genera una lección sobre {{ tema }}...",
 * });
 * ```
 */
export function useCrearPlantilla() {
  const [isCreando, setIsCreando] = useState(false);

  const crearPlantilla = async (dto: CrearPlantillaDto) => {
    setIsCreando(true);

    try {
      const response = await apiClient.post('/prompt-templates', dto);
      const plantilla = response.data;

      // Revalidar la lista de plantillas
      mutate((key: string) => typeof key === 'string' && key.startsWith('/api/v1/prompt-templates'));

      toast.success('La plantilla se ha creado correctamente.');

      return plantilla;
    } catch (error: any) {
      toast.error(`Error al crear: ${error.message}`);
      throw error;
    } finally {
      setIsCreando(false);
    }
  };

  return {
    crearPlantilla,
    isCreando,
  };
}

// ============================================================================
// HOOK: useActualizarPlantilla
// ============================================================================

/**
 * Hook para actualizar una plantilla existente.
 *
 * Uso:
 * ```tsx
 * const { actualizarPlantilla, isActualizando } = useActualizarPlantilla();
 *
 * await actualizarPlantilla(plantillaId, {
 *   nombre: "Nuevo nombre",
 *   descripcion: "Nueva descripción",
 * });
 * ```
 */
export function useActualizarPlantilla() {
  const [isActualizando, setIsActualizando] = useState(false);

  const actualizarPlantilla = async (
    plantillaId: string,
    dto: Partial<CrearPlantillaDto>
  ) => {
    setIsActualizando(true);

    try {
      const response = await apiClient.put(`/prompt-templates/${plantillaId}`, dto);
      const plantilla = response.data;

      // Revalidar
      mutate(`/api/v1/prompt-templates/${plantillaId}`);
      mutate((key: string) => typeof key === 'string' && key.startsWith('/api/v1/prompt-templates'));

      toast.success('La plantilla se ha actualizado correctamente.');

      return plantilla;
    } catch (error: any) {
      toast.error(`Error al actualizar: ${error.message}`);
      throw error;
    } finally {
      setIsActualizando(false);
    }
  };

  return {
    actualizarPlantilla,
    isActualizando,
  };
}

// ============================================================================
// HOOK: useEliminarPlantilla
// ============================================================================

/**
 * Hook para eliminar una plantilla.
 *
 * Uso:
 * ```tsx
 * const { eliminarPlantilla, isEliminando } = useEliminarPlantilla();
 *
 * await eliminarPlantilla(plantillaId);
 * ```
 */
export function useEliminarPlantilla() {
  const [isEliminando, setIsEliminando] = useState(false);

  const eliminarPlantilla = async (plantillaId: string) => {
    setIsEliminando(true);

    try {
      await apiClient.delete(`/prompt-templates/${plantillaId}`);

      // Revalidar la lista de plantillas
      mutate((key: string) => typeof key === 'string' && key.startsWith('/api/v1/prompt-templates'));

      toast.success('La plantilla se ha eliminado correctamente.');
    } catch (error: any) {
      toast.error(`Error al eliminar: ${error.message}`);
      throw error;
    } finally {
      setIsEliminando(false);
    }
  };

  return {
    eliminarPlantilla,
    isEliminando,
  };
}

// ============================================================================
// HOOK: useClonarPlantilla
// ============================================================================

/**
 * Hook para clonar una plantilla existente.
 *
 * Uso:
 * ```tsx
 * const { clonarPlantilla, isClonando } = useClonarPlantilla();
 *
 * await clonarPlantilla(plantillaId, "Mi copia de la plantilla");
 * ```
 */
export function useClonarPlantilla() {
  const [isClonando, setIsClonando] = useState(false);

  const clonarPlantilla = async (
    plantillaId: string,
    nuevoNombre?: string
  ) => {
    setIsClonando(true);

    try {
      const response = await apiClient.post(
        `/prompt-templates/${plantillaId}/clonar`,
        { nuevoNombre }
      );
      const plantilla = response.data;

      // Revalidar la lista de plantillas
      mutate((key: string) => typeof key === 'string' && key.startsWith('/api/v1/prompt-templates'));

      toast.success('La plantilla se ha clonado correctamente.');

      return plantilla;
    } catch (error: any) {
      toast.error(`Error al clonar: ${error.message}`);
      throw error;
    } finally {
      setIsClonando(false);
    }
  };

  return {
    clonarPlantilla,
    isClonando,
  };
}

// ============================================================================
// HOOK: useRenderizarPlantilla
// ============================================================================

/**
 * Hook para renderizar una plantilla con variables.
 *
 * Uso:
 * ```tsx
 * const { renderizarPlantilla, isRenderizando } = useRenderizarPlantilla();
 *
 * const promptRenderizado = await renderizarPlantilla(plantillaId, {
 *   tema: "Interfaces en TypeScript",
 *   programa_nombre: "Curso de TypeScript"
 * });
 * ```
 */
export function useRenderizarPlantilla() {
  const [isRenderizando, setIsRenderizando] = useState(false);

  const renderizarPlantilla = async (
    plantillaId: string,
    variables: Record<string, any>
  ): Promise<string> => {
    setIsRenderizando(true);

    try {
      const response = await apiClient.post(
        `/prompt-templates/${plantillaId}/renderizar`,
        { variables }
      );
      const { promptRenderizado } = response.data;

      return promptRenderizado;
    } catch (error: any) {
      toast.error(`Error al renderizar: ${error.message}`);
      throw error;
    } finally {
      setIsRenderizando(false);
    }
  };

  return {
    renderizarPlantilla,
    isRenderizando,
  };
}
