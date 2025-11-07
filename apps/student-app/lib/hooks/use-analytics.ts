import useSWR from 'swr';

// ============================================================================
// TIPOS
// ============================================================================

export interface FrictionPoint {
  id: string;
  componente_snapshot: string;
  componente_nombre: string;
  componente_tipo: string;
  componente_orden: number;
  tipo_problema: 'abandono_alto' | 'tiempo_excesivo' | 'scores_bajos' | 'intentos_multiples' | 'ayuda_frecuente' | 'error_recurrente';
  severidad: 'baja' | 'media' | 'alta' | 'critica';
  estudiantes_afectados: number;
  estudiantes_totales: number;
  porcentaje_afectados: number;
  tasa_abandono?: number;
  tiempo_promedio?: number;
  tiempo_esperado?: number;
  descripcion: string;
  analisis_ia: string;
  sugerencias: string[];
  estado: 'detectado' | 'en_revision' | 'en_solucion' | 'resuelto' | 'descartado';
  detectado_at: string;
}

export interface QualitativeTheme {
  id: string;
  tema: string;
  frecuencia: number;
  sentimiento: 'positivo' | 'neutral' | 'negativo';
  concepto_erroneo?: string;
  descripcion_error?: string;
  ejemplos_error?: string[];
}

export interface ComponenteSnapshot {
  id: string;
  nombre: string;
  tipo: string;
  orden: number;
}

export interface StudentProgress {
  componente_snapshot: string;
  estado: 'no_iniciado' | 'en_progreso' | 'completado' | 'bloqueado';
  score: number;
  tiempo_invertido_minutos: number;
  orden: number;
}

export interface HeatmapStudent {
  inscripcionId: string;
  estudianteNombre: string;
  estudianteAvatar: string;
  estudianteId: string;
  estudianteEstado: 'activo' | 'pausado' | 'completado' | 'abandonado';
  progresos: StudentProgress[];
}

export interface HeatmapData {
  componentes: ComponenteSnapshot[];
  estudiantes: HeatmapStudent[];
}

export interface StudentDetail {
  estudiante: {
    id: string;
    nombre: string;
    email: string;
    avatar: string;
  };
  progreso: Array<{
    id: string;
    componente_nombre: string;
    componente_tipo: string;
    componente_orden: number;
    estado: string;
    score: number;
    tiempo_invertido_minutos: number;
    intentos: number;
    fecha_inicio?: string;
    fecha_completacion?: string;
    datos_estudiante?: {
      tipo: string;
      datos: any;
    };
    evaluacion_resultado?: {
      score_general: number;
      scores_por_dimension: Record<string, number>;
      analisis_cualitativo: string;
    };
  }>;
}

export interface CohorteMetrics {
  metricas: Array<{
    id: string;
    componente_nombre: string;
    componente_tipo: string;
    componente_orden: number;
    tasa_completacion: number;
    tiempo_promedio_minutos: number;
    score_promedio: number;
    estudiantes_count: number;
  }>;
  estadisticas: {
    total_estudiantes: number;
    estudiantes_activos: number;
    progreso_promedio: number;
  } | null;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para obtener puntos de fricción de una cohorte
 */
export function useFrictionPoints(cohorteId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<FrictionPoint[]>(
    cohorteId ? `/api/v1/cohortes/${cohorteId}/analytics/friction-points` : null
  );

  return {
    frictionPoints: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook para obtener análisis cualitativo de una cohorte
 */
export function useQualitativeAnalysis(cohorteId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<QualitativeTheme[]>(
    cohorteId ? `/api/v1/cohortes/${cohorteId}/analytics/qualitative` : null
  );

  return {
    themes: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook para obtener datos del heatmap de progreso
 */
export function useHeatmapData(cohorteId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<HeatmapData>(
    cohorteId ? `/api/v1/cohortes/${cohorteId}/analytics/heatmap` : null
  );

  return {
    heatmapData: data,
    componentes: data?.componentes || [],
    estudiantes: data?.estudiantes || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook para obtener métricas generales de una cohorte
 */
export function useCohorteMetrics(cohorteId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<CohorteMetrics>(
    cohorteId ? `/api/v1/cohortes/${cohorteId}/analytics/metrics` : null
  );

  return {
    metrics: data,
    metricas: data?.metricas || [],
    estadisticas: data?.estadisticas,
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook para obtener detalle de progreso de un estudiante
 */
export function useStudentProgressDetail(
  cohorteId: string | null,
  estudianteId: string | null
) {
  const { data, error, isLoading, mutate } = useSWR<StudentDetail>(
    cohorteId && estudianteId
      ? `/api/v1/cohortes/${cohorteId}/estudiantes/${estudianteId}/progress-detail`
      : null
  );

  return {
    studentDetail: data,
    estudiante: data?.estudiante,
    progreso: data?.progreso || [],
    isLoading,
    error,
    refresh: mutate,
  };
}
