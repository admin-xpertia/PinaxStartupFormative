/**
 * Configuración de SurrealDB para la plataforma Xpertia
 *
 * Este archivo contiene la configuración necesaria para conectarse
 * a la base de datos SurrealDB desde las aplicaciones.
 */

export interface SurrealDBConfig {
  url: string;
  namespace: string;
  database: string;
  auth?: {
    username?: string;
    password?: string;
    token?: string;
  };
}

/**
 * Configuración por defecto para desarrollo
 */
export const defaultConfig: SurrealDBConfig = {
  url: process.env.SURREAL_URL || 'http://localhost:8000',
  namespace: process.env.SURREAL_NAMESPACE || 'xpertia',
  database: process.env.SURREAL_DATABASE || 'plataforma',
  auth: {
    username: process.env.SURREAL_USER || 'root',
    password: process.env.SURREAL_PASS || 'root',
  },
};

/**
 * Configuración para testing
 */
export const testConfig: SurrealDBConfig = {
  url: process.env.SURREAL_TEST_URL || 'http://localhost:8000',
  namespace: 'xpertia_test',
  database: 'plataforma_test',
  auth: {
    username: process.env.SURREAL_USER || 'root',
    password: process.env.SURREAL_PASS || 'root',
  },
};

/**
 * Configuración para producción
 */
export const productionConfig: SurrealDBConfig = {
  url: process.env.SURREAL_URL!,
  namespace: process.env.SURREAL_NAMESPACE!,
  database: process.env.SURREAL_DATABASE!,
  auth: {
    username: process.env.SURREAL_USER,
    password: process.env.SURREAL_PASS,
    token: process.env.SURREAL_TOKEN,
  },
};

/**
 * Obtiene la configuración según el entorno
 */
export function getConfig(): SurrealDBConfig {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    default:
      return defaultConfig;
  }
}

/**
 * Nombres de las tablas del esquema
 */
export const Tables = {
  // Autenticación
  USER: 'user',
  SESSION: 'session',
  REFRESH_TOKEN: 'refresh_token',
  PASSWORD_RESET: 'password_reset',

  // Contenido y Autoría
  PROGRAMA: 'programa',
  VERSION_PROGRAMA: 'version_programa',
  COHORTE: 'cohorte',
  FASE: 'fase',
  FASE_DOCUMENTATION: 'fase_documentation',
  PROOF_POINT: 'proof_point',
  PREREQUISITOS_PROOF_POINT: 'prerequisitos_proof_point',
  NIVEL: 'nivel',
  COMPONENTE: 'componente',
  PREREQUISITOS_COMPONENTE: 'prerequisitos_componente',
  COMPONENTE_CONTENIDO: 'componente_contenido',
  RUBRICA_EVALUACION: 'rubrica_evaluacion',

  // Generación con IA
  GENERACION_REQUEST: 'generacion_request',
  CONTENIDO_GENERADO: 'contenido_generado',
  VALIDACION_CALIDAD: 'validacion_calidad',
  GENERACION_FEEDBACK: 'generacion_feedback',

  // Ejecución y Estudiantes
  ESTUDIANTE: 'estudiante',
  INSCRIPCION_COHORTE: 'inscripcion_cohorte',
  PROGRESO_PROOF_POINT: 'progreso_proof_point',
  PROGRESO_NIVEL: 'progreso_nivel',
  PROGRESO_COMPONENTE: 'progreso_componente',
  DATOS_ESTUDIANTE: 'datos_estudiante',
  EVALUACION_RESULTADO: 'evaluacion_resultado',
  FEEDBACK_GENERADO: 'feedback_generado',

  // Portafolio
  PORTAFOLIO: 'portafolio',
  REPORTE_INTEGRAL: 'reporte_integral',
  ARTEFACTO: 'artefacto',
  SHARED_PORTFOLIO_LINK: 'shared_portfolio_link',
  VISTA_PORTAFOLIO: 'vista_portafolio',
  BADGE: 'badge',
  ESTUDIANTE_BADGE: 'estudiante_badge',

  // Analytics
  EVENTO_TELEMETRIA: 'evento_telemetria',
  METRICAS_COMPONENTE: 'metricas_componente',
  METRICAS_PROOF_POINT: 'metricas_proof_point',
  PUNTO_DE_FRICCION: 'punto_de_friccion',
  METRICAS_COHORTE: 'metricas_cohorte',
  ALERTA_SISTEMA: 'alerta_sistema',

  // Versionamiento
  VERSION_CONTENIDO: 'version_contenido',
  SNAPSHOT_PROGRAMA: 'snapshot_programa',
  CAMBIO_CONTENIDO: 'cambio_contenido',
  COMPARACION_VERSION: 'comparacion_version',
  ROLLBACK_HISTORIA: 'rollback_historia',
  APROBACION_VERSION: 'aprobacion_version',
  CONFLICTO_VERSION: 'conflicto_version',
} as const;

/**
 * Scopes definidos en el esquema
 */
export const Scopes = {
  USUARIO: 'usuario_scope',
} as const;

/**
 * Roles de usuario
 */
export enum UserRole {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  ESTUDIANTE = 'estudiante',
}

/**
 * Estados de programa
 */
export enum ProgramaEstado {
  DRAFT = 'draft',
  PUBLICADO = 'publicado',
  ARCHIVADO = 'archivado',
}

/**
 * Estados de progreso
 */
export enum ProgresoEstado {
  NO_INICIADO = 'no_iniciado',
  EN_PROGRESO = 'en_progreso',
  COMPLETADO = 'completado',
}

/**
 * Estados extendidos de progreso de ejercicio (flujo de revisión)
 */
export enum ExerciseProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED_FOR_REVIEW = 'submitted_for_review',
  REQUIRES_ITERATION = 'requires_iteration',
  APPROVED = 'approved',
}

/**
 * Tipos de componente
 */
export enum ComponenteTipo {
  LECCION = 'leccion',
  CUADERNO = 'cuaderno',
  SIMULACION = 'simulacion',
  HERRAMIENTA = 'herramienta',
}

/**
 * Tipos de artefacto
 */
export enum ArtefactoTipo {
  STORYBOARD = 'storyboard',
  CANVAS = 'canvas',
  GRAFICA = 'grafica',
  DOCUMENTO = 'documento',
  VIDEO = 'video',
  PRESENTACION = 'presentacion',
  CODIGO = 'codigo',
  OTRO = 'otro',
}

/**
 * Severidad de punto de fricción
 */
export enum FriccionSeveridad {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  CRITICA = 'critica',
}

/**
 * Tipos de evento de telemetría
 */
export enum TipoEvento {
  INICIADO = 'iniciado',
  PAUSADO = 'pausado',
  COMPLETADO = 'completado',
  ABANDONADO = 'abandonado',
  CLICK = 'click',
  SCROLL = 'scroll',
  SUBMIT = 'submit',
  ERROR = 'error',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  FEEDBACK_SOLICITADO = 'feedback_solicitado',
  AYUDA_SOLICITADA = 'ayuda_solicitada',
}

export type TableName = typeof Tables[keyof typeof Tables];
export type ScopeName = typeof Scopes[keyof typeof Scopes];
