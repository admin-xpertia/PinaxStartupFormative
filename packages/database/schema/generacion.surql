-- ============================================================================
-- ESQUEMA DE GENERACIÓN CON IA
-- ============================================================================
-- Define las tablas para generación de contenido con IA y validación
-- Fecha: 2025-11-04
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLA: componente_contenido
-- Descripción: Contenido generado y versiones del componente
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS componente_contenido SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS componente ON componente_contenido TYPE record<componente>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS tipo ON componente_contenido TYPE string
    ASSERT $value IN ['leccion', 'cuaderno', 'simulacion', 'herramienta'];

DEFINE FIELD IF NOT EXISTS contenido ON componente_contenido TYPE object
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS estado ON componente_contenido TYPE string
    ASSERT $value IN ['draft', 'publicado']
    DEFAULT 'draft';

DEFINE FIELD IF NOT EXISTS created_at ON componente_contenido TYPE datetime
    DEFAULT time::now();

DEFINE FIELD IF NOT EXISTS validacion_calidad ON componente_contenido TYPE record<validacion_calidad>;

-- Índices básicos
DEFINE INDEX IF NOT EXISTS compContenidoComponenteIdx ON componente_contenido FIELDS componente;
DEFINE INDEX IF NOT EXISTS compContenidoEstadoIdx ON componente_contenido FIELDS estado;

-- ----------------------------------------------------------------------------
-- TABLA: generacion_request
-- Descripción: Solicitudes de generación de contenido con IA
-- NOTA: Ahora soporta tanto 'componente' (legacy) como 'exercise_instance' (nuevo)
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS generacion_request SCHEMAFULL;

-- Legacy: para migración gradual
DEFINE FIELD IF NOT EXISTS componente ON generacion_request FLEXIBLE TYPE option<record<componente>>;

-- Nuevo: para ejercicios basados en templates
DEFINE FIELD IF NOT EXISTS exercise_instance ON generacion_request FLEXIBLE TYPE option<record<exercise_instance>>;

DEFINE FIELD IF NOT EXISTS solicitado_por ON generacion_request TYPE record<user>
    ASSERT $value != NONE;

-- Template usado (para nuevo sistema)
DEFINE FIELD IF NOT EXISTS template ON generacion_request FLEXIBLE TYPE option<record<exercise_template>>;

-- Configuración de la generación (modelo, temperatura, etc.)
DEFINE FIELD IF NOT EXISTS configuracion ON generacion_request TYPE object
    DEFAULT {};

DEFINE FIELD IF NOT EXISTS prompt_usado ON generacion_request TYPE string
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS estado ON generacion_request TYPE string
    ASSERT $value IN ['pending', 'processing', 'completed', 'failed']
    DEFAULT 'pending';

DEFINE FIELD IF NOT EXISTS error_message ON generacion_request FLEXIBLE TYPE option<string>;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON generacion_request TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS completed_at ON generacion_request FLEXIBLE TYPE option<datetime>;

-- Índices
DEFINE INDEX IF NOT EXISTS genReqComponenteIdx ON generacion_request FIELDS componente;
DEFINE INDEX IF NOT EXISTS genReqExerciseIdx ON generacion_request FIELDS exercise_instance;
DEFINE INDEX IF NOT EXISTS genReqSolicitanteIdx ON generacion_request FIELDS solicitado_por;
DEFINE INDEX IF NOT EXISTS genReqEstadoIdx ON generacion_request FIELDS estado;

-- ----------------------------------------------------------------------------
-- TABLA: contenido_generado
-- Descripción: Contenido producido por la IA
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS contenido_generado SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS generacion_request ON contenido_generado TYPE record<generacion_request>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS contenido_raw ON contenido_generado TYPE string
    ASSERT $value != NONE;

-- Metadata del modelo (nombre, versión, tokens usados, etc.)
DEFINE FIELD IF NOT EXISTS metadata ON contenido_generado TYPE object
    DEFAULT {};

DEFINE FIELD IF NOT EXISTS tokens_usados ON contenido_generado TYPE int
    DEFAULT 0;

DEFINE FIELD IF NOT EXISTS costo_estimado ON contenido_generado TYPE float
    DEFAULT 0.0;

DEFINE FIELD IF NOT EXISTS generated_at ON contenido_generado TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX IF NOT EXISTS contGenReqIdx ON contenido_generado FIELDS generacion_request;

-- ----------------------------------------------------------------------------
-- TABLA: validacion_calidad
-- Descripción: Análisis de calidad generado por IA
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS validacion_calidad SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS score_general ON validacion_calidad TYPE float;
DEFINE FIELD IF NOT EXISTS metricas ON validacion_calidad TYPE object;
DEFINE FIELD IF NOT EXISTS sugerencias ON validacion_calidad TYPE array;
DEFINE FIELD IF NOT EXISTS comparacion_objetivos ON validacion_calidad TYPE array;

-- ----------------------------------------------------------------------------
-- TABLA: generacion_feedback
-- Descripción: Feedback humano sobre contenido generado para mejorar el modelo
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS generacion_feedback SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS contenido_generado ON generacion_feedback TYPE record<contenido_generado>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS usuario ON generacion_feedback TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS rating ON generacion_feedback TYPE int
    ASSERT $value >= 1 AND $value <= 5;

DEFINE FIELD IF NOT EXISTS comentario ON generacion_feedback TYPE string;

DEFINE FIELD IF NOT EXISTS aspectos_positivos ON generacion_feedback TYPE array
    DEFAULT [];

DEFINE FIELD IF NOT EXISTS aspectos_negativos ON generacion_feedback TYPE array
    DEFAULT [];

DEFINE FIELD IF NOT EXISTS sugerencias_mejora ON generacion_feedback TYPE string;

DEFINE FIELD IF NOT EXISTS created_at ON generacion_feedback TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX IF NOT EXISTS genFeedbackContIdx ON generacion_feedback FIELDS contenido_generado;
DEFINE INDEX IF NOT EXISTS genFeedbackUsuarioIdx ON generacion_feedback FIELDS usuario;
DEFINE INDEX IF NOT EXISTS genFeedbackRatingIdx ON generacion_feedback FIELDS rating;

-- ----------------------------------------------------------------------------
-- TABLA: prompt_template
-- Descripción: Biblioteca de plantillas de prompts reutilizables
-- ----------------------------------------------------------------------------
DEFINE TABLE prompt_template SCHEMAFULL;

DEFINE FIELD nombre ON prompt_template TYPE string;

DEFINE FIELD descripcion ON prompt_template TYPE string;

DEFINE FIELD tipo_componente ON prompt_template TYPE string
    ASSERT $value IN ['leccion', 'cuaderno', 'simulacion', 'herramienta'];

DEFINE FIELD prompt_template ON prompt_template TYPE string;

DEFINE FIELD config_default ON prompt_template TYPE object;

DEFINE FIELD autor ON prompt_template TYPE string;

DEFINE FIELD es_oficial ON prompt_template TYPE bool
    DEFAULT false;

DEFINE FIELD creador ON prompt_template TYPE record<user>;

DEFINE FIELD created_at ON prompt_template TYPE datetime
    DEFAULT time::now();
