-- ============================================================================
-- ESQUEMA DE GENERACIÓN CON IA
-- ============================================================================
-- Define las tablas para generación de contenido con IA y validación
-- Fecha: 2025-11-04
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLA: generacion_request
-- Descripción: Solicitudes de generación de contenido con IA
-- ----------------------------------------------------------------------------
DEFINE TABLE generacion_request SCHEMAFULL;

DEFINE FIELD componente ON generacion_request TYPE record<componente>
    ASSERT $value != NONE;

DEFINE FIELD solicitado_por ON generacion_request TYPE record<user>
    ASSERT $value != NONE;

-- Configuración de la generación (modelo, temperatura, etc.)
DEFINE FIELD configuracion ON generacion_request TYPE object
    DEFAULT {};

DEFINE FIELD prompt_usado ON generacion_request TYPE string
    ASSERT $value != NONE;

DEFINE FIELD estado ON generacion_request TYPE string
    ASSERT $value IN ['pending', 'processing', 'completed', 'failed']
    DEFAULT 'pending';

DEFINE FIELD error_message ON generacion_request TYPE string;

-- Timestamps
DEFINE FIELD created_at ON generacion_request TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD completed_at ON generacion_request TYPE datetime;

-- Índices
DEFINE INDEX genReqComponenteIdx ON generacion_request FIELDS componente;
DEFINE INDEX genReqSolicitanteIdx ON generacion_request FIELDS solicitado_por;
DEFINE INDEX genReqEstadoIdx ON generacion_request FIELDS estado;

-- ----------------------------------------------------------------------------
-- TABLA: contenido_generado
-- Descripción: Contenido producido por la IA
-- ----------------------------------------------------------------------------
DEFINE TABLE contenido_generado SCHEMAFULL;

DEFINE FIELD generacion_request ON contenido_generado TYPE record<generacion_request>
    ASSERT $value != NONE;

DEFINE FIELD contenido_raw ON contenido_generado TYPE string
    ASSERT $value != NONE;

-- Metadata del modelo (nombre, versión, tokens usados, etc.)
DEFINE FIELD metadata ON contenido_generado TYPE object
    DEFAULT {};

DEFINE FIELD tokens_usados ON contenido_generado TYPE int
    DEFAULT 0;

DEFINE FIELD costo_estimado ON contenido_generado TYPE float
    DEFAULT 0.0;

DEFINE FIELD generated_at ON contenido_generado TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX contGenReqIdx ON contenido_generado FIELDS generacion_request;

-- ----------------------------------------------------------------------------
-- TABLA: validacion_calidad
-- Descripción: Validación de calidad del contenido generado
-- ----------------------------------------------------------------------------
DEFINE TABLE validacion_calidad SCHEMAFULL;

DEFINE FIELD contenido_generado ON validacion_calidad TYPE record<contenido_generado>
    ASSERT $value != NONE;

-- Scores de diferentes dimensiones de calidad
DEFINE FIELD score_lecturabilidad ON validacion_calidad TYPE float
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD score_cobertura_conceptos ON validacion_calidad TYPE float
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD score_accesibilidad ON validacion_calidad TYPE float
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD score_general ON validacion_calidad TYPE float
    ASSERT $value >= 0 AND $value <= 100;

-- Issues encontrados durante la validación
DEFINE FIELD issues_encontrados ON validacion_calidad TYPE array
    DEFAULT [];

DEFINE FIELD aprobado ON validacion_calidad TYPE bool
    DEFAULT false;

DEFINE FIELD revisado_por ON validacion_calidad TYPE record<user>;

DEFINE FIELD comentarios ON validacion_calidad TYPE string;

-- Timestamps
DEFINE FIELD created_at ON validacion_calidad TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON validacion_calidad TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX validacionContGenIdx ON validacion_calidad FIELDS contenido_generado;
DEFINE INDEX validacionAprobadoIdx ON validacion_calidad FIELDS aprobado;

-- ----------------------------------------------------------------------------
-- TABLA: generacion_feedback
-- Descripción: Feedback humano sobre contenido generado para mejorar el modelo
-- ----------------------------------------------------------------------------
DEFINE TABLE generacion_feedback SCHEMAFULL;

DEFINE FIELD contenido_generado ON generacion_feedback TYPE record<contenido_generado>
    ASSERT $value != NONE;

DEFINE FIELD usuario ON generacion_feedback TYPE record<user>
    ASSERT $value != NONE;

DEFINE FIELD rating ON generacion_feedback TYPE int
    ASSERT $value >= 1 AND $value <= 5;

DEFINE FIELD comentario ON generacion_feedback TYPE string;

DEFINE FIELD aspectos_positivos ON generacion_feedback TYPE array
    DEFAULT [];

DEFINE FIELD aspectos_negativos ON generacion_feedback TYPE array
    DEFAULT [];

DEFINE FIELD sugerencias_mejora ON generacion_feedback TYPE string;

DEFINE FIELD created_at ON generacion_feedback TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX genFeedbackContIdx ON generacion_feedback FIELDS contenido_generado;
DEFINE INDEX genFeedbackUsuarioIdx ON generacion_feedback FIELDS usuario;
DEFINE INDEX genFeedbackRatingIdx ON generacion_feedback FIELDS rating;
