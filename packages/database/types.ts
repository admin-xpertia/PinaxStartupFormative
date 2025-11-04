/**
 * Tipos TypeScript generados del esquema SurrealDB
 *
 * Estos tipos representan la estructura de las tablas en la base de datos.
 * Se utilizan para proporcionar type safety en la aplicación.
 */

/**
 * ID de registro de SurrealDB
 * Formato: "tabla:id"
 */
export type RecordId<T extends string = string> = `${T}:${string}`;

/**
 * Tipos base
 */
export type DateTime = string; // ISO 8601 format
export type JSONObject = Record<string, any>;

// ============================================================================
// AUTENTICACIÓN Y USUARIOS
// ============================================================================

export interface User {
  id: RecordId<'user'>;
  email: string;
  nombre: string;
  password_hash: string;
  rol: 'admin' | 'instructor' | 'estudiante';
  preferencias: JSONObject;
  activo: boolean;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface Session {
  id: RecordId<'session'>;
  user: RecordId<'user'>;
  token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: DateTime;
  created_at: DateTime;
  last_activity: DateTime;
}

export interface RefreshToken {
  id: RecordId<'refresh_token'>;
  user: RecordId<'user'>;
  token: string;
  expires_at: DateTime;
  revoked: boolean;
  created_at: DateTime;
}

export interface PasswordReset {
  id: RecordId<'password_reset'>;
  user: RecordId<'user'>;
  token: string;
  expires_at: DateTime;
  used: boolean;
  created_at: DateTime;
}

// ============================================================================
// CONTENIDO Y AUTORÍA
// ============================================================================

export interface Programa {
  id: RecordId<'programa'>;
  nombre: string;
  descripcion?: string;
  duracion_semanas: number;
  estado: 'draft' | 'publicado' | 'archivado';
  version_actual: string;
  creador: RecordId<'user'>;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface VersionPrograma {
  id: RecordId<'version_programa'>;
  programa: RecordId<'programa'>;
  version: string;
  cambios_descripcion?: string;
  contenido_snapshot?: JSONObject;
  creado_por: RecordId<'user'>;
  created_at: DateTime;
}

export interface Cohorte {
  id: RecordId<'cohorte'>;
  programa: RecordId<'programa'>;
  nombre: string;
  fecha_inicio: DateTime;
  fecha_fin_estimada?: DateTime;
  snapshot_programa?: RecordId<'snapshot_programa'>;
  instructor?: RecordId<'user'>;
  activo: boolean;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface Fase {
  id: RecordId<'fase'>;
  programa: RecordId<'programa'>;
  numero_fase: number;
  nombre: string;
  descripcion?: string;
  objetivos_aprendizaje: string[];
  duracion_semanas_estimada: number;
  orden: number;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface FaseDocumentation {
  id: RecordId<'fase_documentation'>;
  fase: RecordId<'fase'>;
  contexto_general?: string;
  conceptos_clave: JSONObject[];
  casos_ejemplo: JSONObject[];
  errores_comunes: JSONObject[];
  recursos_referencia: JSONObject[];
  criterios_evaluacion: JSONObject;
  updated_at: DateTime;
}

export interface ProofPoint {
  id: RecordId<'proof_point'>;
  fase: RecordId<'fase'>;
  nombre: string;
  slug: string;
  descripcion?: string;
  pregunta_central?: string;
  orden_en_fase: number;
  duracion_estimada_horas: number;
  tipo_entregable_final?: string;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface PrerequisitosProofPoint {
  id: RecordId<'prerequisitos_proof_point'>;
  proof_point: RecordId<'proof_point'>;
  prerequisito: RecordId<'proof_point'>;
  created_at: DateTime;
}

export interface Nivel {
  id: RecordId<'nivel'>;
  proof_point: RecordId<'proof_point'>;
  numero_nivel: number;
  nombre: string;
  objetivo_especifico?: string;
  criterio_completacion: {
    logica: 'AND' | 'OR';
    reglas: any[];
  };
  created_at: DateTime;
  updated_at: DateTime;
}

export interface Componente {
  id: RecordId<'componente'>;
  nivel: RecordId<'nivel'>;
  tipo: 'leccion' | 'cuaderno' | 'simulacion' | 'herramienta';
  nombre: string;
  descripcion_breve?: string;
  duracion_estimada_minutos: number;
  orden: number;
  version_contenido_actual?: RecordId<'componente_contenido'>;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface PrerequisitosComponente {
  id: RecordId<'prerequisitos_componente'>;
  componente: RecordId<'componente'>;
  prerequisito: RecordId<'componente'>;
  created_at: DateTime;
}

export interface ComponenteContenido {
  id: RecordId<'componente_contenido'>;
  componente: RecordId<'componente'>;
  tipo: 'leccion' | 'cuaderno' | 'simulacion' | 'herramienta';
  contenido: JSONObject;
  estado: 'draft' | 'revision' | 'publicado';
  created_at: DateTime;
  updated_at: DateTime;
}

export interface RubricaEvaluacion {
  id: RecordId<'rubrica_evaluacion'>;
  componente: RecordId<'componente'>;
  dimensiones: string[];
  descriptores_nivel: JSONObject;
  pesos: JSONObject;
  created_at: DateTime;
  updated_at: DateTime;
}

// ============================================================================
// GENERACIÓN CON IA
// ============================================================================

export interface GeneracionRequest {
  id: RecordId<'generacion_request'>;
  componente: RecordId<'componente'>;
  solicitado_por: RecordId<'user'>;
  configuracion: JSONObject;
  prompt_usado: string;
  estado: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: DateTime;
  completed_at?: DateTime;
}

export interface ContenidoGenerado {
  id: RecordId<'contenido_generado'>;
  generacion_request: RecordId<'generacion_request'>;
  contenido_raw: string;
  metadata: JSONObject;
  tokens_usados: number;
  costo_estimado: number;
  generated_at: DateTime;
}

export interface ValidacionCalidad {
  id: RecordId<'validacion_calidad'>;
  contenido_generado: RecordId<'contenido_generado'>;
  score_lecturabilidad: number;
  score_cobertura_conceptos: number;
  score_accesibilidad: number;
  score_general: number;
  issues_encontrados: any[];
  aprobado: boolean;
  revisado_por?: RecordId<'user'>;
  comentarios?: string;
  created_at: DateTime;
  updated_at: DateTime;
}

// ============================================================================
// EJECUCIÓN Y ESTUDIANTES
// ============================================================================

export interface Estudiante {
  id: RecordId<'estudiante'>;
  user: RecordId<'user'>;
  metadata: JSONObject;
  fecha_nacimiento?: DateTime;
  pais?: string;
  ciudad?: string;
  nivel_educativo?: string;
  intereses: string[];
  created_at: DateTime;
  updated_at: DateTime;
}

export interface InscripcionCohorte {
  id: RecordId<'inscripcion_cohorte'>;
  estudiante: RecordId<'estudiante'>;
  cohorte: RecordId<'cohorte'>;
  estado: 'activo' | 'pausado' | 'completado' | 'abandonado';
  fecha_inscripcion: DateTime;
  fecha_finalizacion?: DateTime;
  motivo_pausa?: string;
  progreso_general: number;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface ProgresoProofPoint {
  id: RecordId<'progreso_proof_point'>;
  estudiante: RecordId<'estudiante'>;
  proof_point: RecordId<'proof_point'>;
  estado: 'no_iniciado' | 'en_progreso' | 'completado';
  fecha_inicio?: DateTime;
  fecha_completacion?: DateTime;
  score_final: number;
  tiempo_total_minutos: number;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface ProgresoNivel {
  id: RecordId<'progreso_nivel'>;
  progreso_proof_point: RecordId<'progreso_proof_point'>;
  nivel: RecordId<'nivel'>;
  estado: 'no_iniciado' | 'en_progreso' | 'completado';
  progreso_porcentaje: number;
  fecha_inicio?: DateTime;
  fecha_completacion?: DateTime;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface ProgresoComponente {
  id: RecordId<'progreso_componente'>;
  progreso_nivel: RecordId<'progreso_nivel'>;
  estudiante: RecordId<'estudiante'>;
  componente: RecordId<'componente'>;
  estado: 'no_iniciado' | 'en_progreso' | 'completado' | 'bloqueado';
  intentos: number;
  tiempo_invertido_minutos: number;
  score: number;
  fecha_inicio?: DateTime;
  fecha_completacion?: DateTime;
  ultima_actividad?: DateTime;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface DatosEstudiante {
  id: RecordId<'datos_estudiante'>;
  progreso_componente: RecordId<'progreso_componente'>;
  tipo: 'respuestas_cuaderno' | 'mensajes_simulacion' | 'output_herramienta' | 'notas' | 'reflexion';
  datos: JSONObject;
  version: number;
  guardado_at: DateTime;
}

export interface EvaluacionResultado {
  id: RecordId<'evaluacion_resultado'>;
  progreso_componente: RecordId<'progreso_componente'>;
  score_general: number;
  scores_por_dimension: JSONObject;
  analisis_cualitativo?: string;
  evaluado_por: 'ai' | 'instructor' | 'auto' | 'peer';
  evaluador?: RecordId<'user'>;
  evaluado_at: DateTime;
}

export interface FeedbackGenerado {
  id: RecordId<'feedback_generado'>;
  evaluacion_resultado: RecordId<'evaluacion_resultado'>;
  feedback_texto: string;
  highlights_positivos: string[];
  areas_mejora: string[];
  siguientes_pasos: string[];
  recursos_recomendados: string[];
  tono: string;
  created_at: DateTime;
}

// ============================================================================
// PORTAFOLIO
// ============================================================================

export interface Portafolio {
  id: RecordId<'portafolio'>;
  estudiante: RecordId<'estudiante'>;
  configuracion_privacidad: {
    publico: boolean;
    mostrar_scores: boolean;
    mostrar_feedback: boolean;
  };
  titulo?: string;
  descripcion?: string;
  banner_url?: string;
  tema: string;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface ReporteIntegral {
  id: RecordId<'reporte_integral'>;
  portafolio: RecordId<'portafolio'>;
  estudiante: RecordId<'estudiante'>;
  proof_point: RecordId<'proof_point'>;
  contenido_markdown?: string;
  pdf_url?: string;
  score_calidad: number;
  estado: 'draft' | 'finalizado' | 'compartido';
  finalizado_at?: DateTime;
  compartido_at?: DateTime;
  metadata: JSONObject;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface Artefacto {
  id: RecordId<'artefacto'>;
  portafolio: RecordId<'portafolio'>;
  tipo: 'storyboard' | 'canvas' | 'grafica' | 'documento' | 'video' | 'presentacion' | 'codigo' | 'otro';
  nombre: string;
  descripcion?: string;
  file_url?: string;
  file_size_bytes?: number;
  mime_type?: string;
  thumbnail_url?: string;
  proof_point?: RecordId<'proof_point'>;
  componente?: RecordId<'componente'>;
  metadata: JSONObject;
  tags: string[];
  destacado: boolean;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface Badge {
  id: RecordId<'badge'>;
  nombre: string;
  descripcion?: string;
  icon_url?: string;
  tipo: 'completacion' | 'excelencia' | 'velocidad' | 'colaboracion' | 'creatividad' | 'especial';
  criterios: JSONObject;
  puntos: number;
  rareza: 'comun' | 'raro' | 'epico' | 'legendario';
  created_at: DateTime;
}

export interface EstudianteBadge {
  id: RecordId<'estudiante_badge'>;
  estudiante: RecordId<'estudiante'>;
  badge: RecordId<'badge'>;
  proof_point?: RecordId<'proof_point'>;
  componente?: RecordId<'componente'>;
  obtenido_at: DateTime;
  visible_en_portafolio: boolean;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface EventoTelemetria {
  id: RecordId<'evento_telemetria'>;
  estudiante: RecordId<'estudiante'>;
  componente?: RecordId<'componente'>;
  tipo_evento: string;
  metadata: JSONObject;
  duracion_ms?: number;
  timestamp: DateTime;
  session_id?: string;
  user_agent?: string;
  dispositivo?: string;
}

export interface MetricasComponente {
  id: RecordId<'metricas_componente'>;
  componente: RecordId<'componente'>;
  cohorte?: RecordId<'cohorte'>;
  tasa_completacion: number;
  tiempo_promedio_minutos: number;
  tiempo_mediana_minutos: number;
  score_promedio: number;
  score_mediana: number;
  distribucion_scores: JSONObject;
  intentos_promedio: number;
  tasa_abandono: number;
  estudiantes_count: number;
  calculado_at: DateTime;
  created_at: DateTime;
  updated_at: DateTime;
}

export interface PuntoDeFriccion {
  id: RecordId<'punto_de_friccion'>;
  componente: RecordId<'componente'>;
  cohorte?: RecordId<'cohorte'>;
  tipo_problema: 'abandono_alto' | 'tiempo_excesivo' | 'scores_bajos' | 'intentos_multiples' | 'ayuda_frecuente' | 'error_recurrente';
  estudiantes_afectados: number;
  porcentaje_afectados: number;
  severidad: 'baja' | 'media' | 'alta' | 'critica';
  descripcion?: string;
  datos_soporte: JSONObject;
  estado: 'detectado' | 'en_revision' | 'en_solucion' | 'resuelto' | 'descartado';
  asignado_a?: RecordId<'user'>;
  notas_resolucion?: string;
  detectado_at: DateTime;
  resuelto_at?: DateTime;
  created_at: DateTime;
  updated_at: DateTime;
}

// ============================================================================
// VERSIONAMIENTO
// ============================================================================

export interface VersionContenido {
  id: RecordId<'version_contenido'>;
  componente: RecordId<'componente'>;
  numero_version: number;
  contenido_snapshot: JSONObject;
  cambios_descripcion?: string;
  tipo_cambio: 'mayor' | 'menor' | 'patch' | 'revision';
  creado_por: RecordId<'user'>;
  checksum?: string;
  tags: string[];
  created_at: DateTime;
}

export interface SnapshotPrograma {
  id: RecordId<'snapshot_programa'>;
  programa: RecordId<'programa'>;
  programa_completo: JSONObject;
  version: string;
  descripcion?: string;
  checksum?: string;
  creado_por: RecordId<'user'>;
  usado_por_cohortes: number;
  created_at: DateTime;
}
