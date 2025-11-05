-- ============================================================================
-- ESQUEMA DE ANALYTICS Y TELEMETRÍA
-- ============================================================================
-- Define las tablas para métricas, eventos y detección de puntos de fricción
-- Fecha: 2025-11-04
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLA: evento_telemetria
-- Descripción: Eventos de telemetría del sistema
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS evento_telemetria SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS estudiante ON evento_telemetria TYPE record<estudiante>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS componente ON evento_telemetria TYPE record<componente>;

DEFINE FIELD IF NOT EXISTS tipo_evento ON evento_telemetria TYPE string
    ASSERT $value IN [
        'iniciado', 'pausado', 'completado', 'abandonado',
        'click', 'scroll', 'submit', 'error',
        'session_start', 'session_end',
        'feedback_solicitado', 'ayuda_solicitada'
    ];

-- Metadata del evento (puede variar según tipo)
DEFINE FIELD IF NOT EXISTS metadata ON evento_telemetria TYPE object
    DEFAULT {};

DEFINE FIELD IF NOT EXISTS duracion_ms ON evento_telemetria TYPE int;

DEFINE FIELD IF NOT EXISTS timestamp ON evento_telemetria TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Contexto de sesión
DEFINE FIELD IF NOT EXISTS session_id ON evento_telemetria TYPE string;

DEFINE FIELD IF NOT EXISTS user_agent ON evento_telemetria TYPE string;

DEFINE FIELD IF NOT EXISTS dispositivo ON evento_telemetria TYPE string;

-- Índices
DEFINE INDEX IF NOT EXISTS eventoEstudianteIdx ON evento_telemetria FIELDS estudiante;
DEFINE INDEX IF NOT EXISTS eventoComponenteIdx ON evento_telemetria FIELDS componente;
DEFINE INDEX IF NOT EXISTS eventoTipoIdx ON evento_telemetria FIELDS tipo_evento;
DEFINE INDEX IF NOT EXISTS eventoTimestampIdx ON evento_telemetria FIELDS timestamp;

-- ----------------------------------------------------------------------------
-- TABLA: metricas_componente
-- Descripción: Métricas agregadas por componente y cohorte
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS metricas_componente SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS componente_snapshot ON metricas_componente TYPE record<snapshot_componente>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS cohorte ON metricas_componente TYPE record<cohorte>
    ASSERT $value != NONE;

-- Métricas de completación
DEFINE FIELD IF NOT EXISTS tasa_completacion ON metricas_componente TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD IF NOT EXISTS tiempo_promedio_minutos ON metricas_componente TYPE int
    DEFAULT 0;

DEFINE FIELD IF NOT EXISTS tiempo_mediana_minutos ON metricas_componente TYPE int
    DEFAULT 0;

-- Métricas de desempeño
DEFINE FIELD IF NOT EXISTS score_promedio ON metricas_componente TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD IF NOT EXISTS score_mediana ON metricas_componente TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

-- Distribución de scores
DEFINE FIELD IF NOT EXISTS distribucion_scores ON metricas_componente TYPE object
    DEFAULT {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
    };

-- Métricas de engagement
DEFINE FIELD IF NOT EXISTS intentos_promedio ON metricas_componente TYPE float
    DEFAULT 0.0;

DEFINE FIELD IF NOT EXISTS tasa_abandono ON metricas_componente TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD IF NOT EXISTS estudiantes_count ON metricas_componente TYPE int
    DEFAULT 0;

DEFINE FIELD IF NOT EXISTS calculado_at ON metricas_componente TYPE datetime
    DEFAULT time::now();

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON metricas_componente TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON metricas_componente TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS metricasCompIdx ON metricas_componente FIELDS componente_snapshot;
DEFINE INDEX IF NOT EXISTS metricasCohorteIdx ON metricas_componente FIELDS cohorte;

-- ----------------------------------------------------------------------------
-- TABLA: metricas_proof_point
-- Descripción: Métricas agregadas por Proof Point
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS metricas_proof_point SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS proof_point ON metricas_proof_point TYPE record<proof_point>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS cohorte ON metricas_proof_point TYPE record<cohorte>;

DEFINE FIELD IF NOT EXISTS tasa_completacion ON metricas_proof_point TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD IF NOT EXISTS tiempo_promedio_horas ON metricas_proof_point TYPE int
    DEFAULT 0;

DEFINE FIELD IF NOT EXISTS score_promedio ON metricas_proof_point TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD IF NOT EXISTS estudiantes_count ON metricas_proof_point TYPE int
    DEFAULT 0;

DEFINE FIELD IF NOT EXISTS calculado_at ON metricas_proof_point TYPE datetime
    DEFAULT time::now();

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON metricas_proof_point TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON metricas_proof_point TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS metricasPPIdx ON metricas_proof_point FIELDS proof_point;
DEFINE INDEX IF NOT EXISTS metricasPPCohorteIdx ON metricas_proof_point FIELDS cohorte;

-- ----------------------------------------------------------------------------
-- TABLA: punto_de_friccion
-- Descripción: Detección de puntos de fricción en el aprendizaje
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS punto_de_friccion SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS componente_snapshot ON punto_de_friccion TYPE record<snapshot_componente>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS cohorte ON punto_de_friccion TYPE record<cohorte>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS tipo_problema ON punto_de_friccion TYPE string
    ASSERT $value IN [
        'abandono_alto', 'tiempo_excesivo', 'scores_bajos',
        'intentos_multiples', 'ayuda_frecuente', 'error_recurrente'
    ];

DEFINE FIELD IF NOT EXISTS estudiantes_afectados ON punto_de_friccion TYPE int
    ASSERT $value >= 0;

DEFINE FIELD IF NOT EXISTS estudiantes_totales ON punto_de_friccion TYPE int
    ASSERT $value >= 0;

DEFINE FIELD IF NOT EXISTS tasa_abandono ON punto_de_friccion TYPE option<float>;

DEFINE FIELD IF NOT EXISTS tiempo_promedio ON punto_de_friccion TYPE option<int>;

DEFINE FIELD IF NOT EXISTS tiempo_esperado ON punto_de_friccion TYPE option<int>;

DEFINE FIELD IF NOT EXISTS porcentaje_afectados ON punto_de_friccion TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD IF NOT EXISTS severidad ON punto_de_friccion TYPE string
    ASSERT $value IN ['baja', 'media', 'alta', 'critica']
    DEFAULT 'media';

DEFINE FIELD IF NOT EXISTS descripcion ON punto_de_friccion TYPE string;

-- AI-generated insights (simulated in seed)
DEFINE FIELD IF NOT EXISTS analisis_ia ON punto_de_friccion TYPE string;

DEFINE FIELD IF NOT EXISTS sugerencias ON punto_de_friccion TYPE array<string> DEFAULT [];

-- Datos de soporte para el diagnóstico
DEFINE FIELD IF NOT EXISTS datos_soporte ON punto_de_friccion TYPE object
    DEFAULT {};

DEFINE FIELD IF NOT EXISTS estado ON punto_de_friccion TYPE string
    ASSERT $value IN ['detectado', 'en_revision', 'en_solucion', 'resuelto', 'descartado']
    DEFAULT 'detectado';

DEFINE FIELD IF NOT EXISTS asignado_a ON punto_de_friccion TYPE record<user>;

DEFINE FIELD IF NOT EXISTS notas_resolucion ON punto_de_friccion TYPE string;

DEFINE FIELD IF NOT EXISTS detectado_at ON punto_de_friccion TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS resuelto_at ON punto_de_friccion TYPE datetime;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON punto_de_friccion TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON punto_de_friccion TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS friccionCompIdx ON punto_de_friccion FIELDS componente_snapshot;
DEFINE INDEX IF NOT EXISTS friccionCohorteIdx ON punto_de_friccion FIELDS cohorte;
DEFINE INDEX IF NOT EXISTS friccionSeveridadIdx ON punto_de_friccion FIELDS severidad;
DEFINE INDEX IF NOT EXISTS friccionEstadoIdx ON punto_de_friccion FIELDS estado;

-- ----------------------------------------------------------------------------
-- TABLA: metricas_cohorte
-- Descripción: Métricas generales de cohortes
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS metricas_cohorte SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS cohorte ON metricas_cohorte TYPE record<cohorte>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS estudiantes_activos ON metricas_cohorte TYPE int
    DEFAULT 0;

DEFINE FIELD IF NOT EXISTS estudiantes_total ON metricas_cohorte TYPE int
    DEFAULT 0;

DEFINE FIELD IF NOT EXISTS tasa_retencion ON metricas_cohorte TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD IF NOT EXISTS progreso_promedio ON metricas_cohorte TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD IF NOT EXISTS tiempo_promedio_semanal_minutos ON metricas_cohorte TYPE int
    DEFAULT 0;

DEFINE FIELD IF NOT EXISTS engagement_score ON metricas_cohorte TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD IF NOT EXISTS calculado_at ON metricas_cohorte TYPE datetime
    DEFAULT time::now();

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON metricas_cohorte TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON metricas_cohorte TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS metricasCohorteIdx ON metricas_cohorte FIELDS cohorte;

-- ----------------------------------------------------------------------------
-- TABLA: alerta_sistema
-- Descripción: Alertas del sistema para instructores y admins
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS alerta_sistema SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS tipo ON alerta_sistema TYPE string
    ASSERT $value IN [
        'estudiante_en_riesgo', 'punto_friccion_critico',
        'bajo_engagement', 'deadline_proximo', 'anomalia_detectada'
    ];

DEFINE FIELD IF NOT EXISTS severidad ON alerta_sistema TYPE string
    ASSERT $value IN ['info', 'advertencia', 'critico']
    DEFAULT 'info';

DEFINE FIELD IF NOT EXISTS titulo ON alerta_sistema TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS descripcion ON alerta_sistema TYPE string;

-- Referencias opcionales
DEFINE FIELD IF NOT EXISTS estudiante ON alerta_sistema TYPE record<estudiante>;

DEFINE FIELD IF NOT EXISTS componente ON alerta_sistema TYPE record<componente>;

DEFINE FIELD IF NOT EXISTS cohorte ON alerta_sistema TYPE record<cohorte>;

DEFINE FIELD IF NOT EXISTS punto_friccion ON alerta_sistema TYPE record<punto_de_friccion>;

-- Destinatarios
DEFINE FIELD IF NOT EXISTS destinatarios ON alerta_sistema TYPE array<record<user>>
    DEFAULT [];

DEFINE FIELD IF NOT EXISTS leida ON alerta_sistema TYPE bool
    DEFAULT false;

DEFINE FIELD IF NOT EXISTS accion_tomada ON alerta_sistema TYPE string;

DEFINE FIELD IF NOT EXISTS created_at ON alerta_sistema TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX IF NOT EXISTS alertaTipoIdx ON alerta_sistema FIELDS tipo;
DEFINE INDEX IF NOT EXISTS alertaSeveridadIdx ON alerta_sistema FIELDS severidad;
DEFINE INDEX IF NOT EXISTS alertaLeidaIdx ON alerta_sistema FIELDS leida;
DEFINE INDEX IF NOT EXISTS alertaCohorteIdx ON alerta_sistema FIELDS cohorte;

-- ----------------------------------------------------------------------------
-- TABLA: analisis_cualitativo
-- Descripción: Análisis cualitativo de feedback y misconceptions
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS analisis_cualitativo SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS cohorte ON analisis_cualitativo TYPE record<cohorte>
    ASSERT $value != NONE;

-- Theme analysis
DEFINE FIELD IF NOT EXISTS tema ON analisis_cualitativo TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS frecuencia ON analisis_cualitativo TYPE int
    DEFAULT 0;

DEFINE FIELD IF NOT EXISTS sentimiento ON analisis_cualitativo TYPE string
    ASSERT $value IN ['positivo', 'neutral', 'negativo']
    DEFAULT 'neutral';

-- Misconception analysis (optional fields)
DEFINE FIELD IF NOT EXISTS concepto_erroneo ON analisis_cualitativo TYPE option<string>;

DEFINE FIELD IF NOT EXISTS descripcion_error ON analisis_cualitativo TYPE option<string>;

DEFINE FIELD IF NOT EXISTS ejemplos_error ON analisis_cualitativo TYPE array<string>
    DEFAULT [];

-- Metadata
DEFINE FIELD IF NOT EXISTS created_at ON analisis_cualitativo TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX IF NOT EXISTS cualitativoCohorteIdx ON analisis_cualitativo FIELDS cohorte;
DEFINE INDEX IF NOT EXISTS cualitativoTemaIdx ON analisis_cualitativo FIELDS tema;
