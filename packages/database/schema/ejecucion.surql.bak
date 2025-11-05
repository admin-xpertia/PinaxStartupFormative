-- ============================================================================
-- ESQUEMA DE EJECUCIÓN Y ESTUDIANTES
-- ============================================================================
-- Define las tablas para estudiantes, inscripciones y progreso de aprendizaje
-- Fecha: 2025-11-04
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLA: estudiante
-- Descripción: Perfil de estudiantes
-- ----------------------------------------------------------------------------
DEFINE TABLE estudiante SCHEMAFULL;

DEFINE FIELD user ON estudiante TYPE record<user>
    ASSERT $value != NONE;

-- Metadata del estudiante (preferencias de aprendizaje, nivel, etc.)
DEFINE FIELD metadata ON estudiante TYPE object
    DEFAULT {};

DEFINE FIELD fecha_nacimiento ON estudiante TYPE datetime;

DEFINE FIELD pais ON estudiante TYPE string;

DEFINE FIELD ciudad ON estudiante TYPE string;

DEFINE FIELD nivel_educativo ON estudiante TYPE string;

DEFINE FIELD intereses ON estudiante TYPE array
    DEFAULT [];

-- Timestamps
DEFINE FIELD created_at ON estudiante TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON estudiante TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX estudianteUserIdx ON estudiante FIELDS user UNIQUE;

-- ----------------------------------------------------------------------------
-- TABLA: inscripcion_cohorte
-- Descripción: Inscripciones de estudiantes en cohortes
-- ----------------------------------------------------------------------------
DEFINE TABLE inscripcion_cohorte SCHEMAFULL;

DEFINE FIELD estudiante ON inscripcion_cohorte TYPE record<estudiante>
    ASSERT $value != NONE;

DEFINE FIELD cohorte ON inscripcion_cohorte TYPE record<cohorte>
    ASSERT $value != NONE;

DEFINE FIELD estado ON inscripcion_cohorte TYPE string
    ASSERT $value IN ['activo', 'pausado', 'completado', 'abandonado']
    DEFAULT 'activo';

DEFINE FIELD fecha_inscripcion ON inscripcion_cohorte TYPE datetime
    DEFAULT time::now();

DEFINE FIELD fecha_finalizacion ON inscripcion_cohorte TYPE datetime;

DEFINE FIELD motivo_pausa ON inscripcion_cohorte TYPE string;

DEFINE FIELD progreso_general ON inscripcion_cohorte TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

-- Timestamps
DEFINE FIELD created_at ON inscripcion_cohorte TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON inscripcion_cohorte TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX inscripcionEstudianteIdx ON inscripcion_cohorte FIELDS estudiante;
DEFINE INDEX inscripcionCohorteIdx ON inscripcion_cohorte FIELDS cohorte;
DEFINE INDEX inscripcionEstadoIdx ON inscripcion_cohorte FIELDS estado;

-- ----------------------------------------------------------------------------
-- TABLA: progreso_proof_point
-- Descripción: Progreso de estudiantes en Proof Points
-- ----------------------------------------------------------------------------
DEFINE TABLE progreso_proof_point SCHEMAFULL;

DEFINE FIELD estudiante ON progreso_proof_point TYPE record<estudiante>
    ASSERT $value != NONE;

DEFINE FIELD proof_point ON progreso_proof_point TYPE record<proof_point>
    ASSERT $value != NONE;

DEFINE FIELD estado ON progreso_proof_point TYPE string
    ASSERT $value IN ['no_iniciado', 'en_progreso', 'completado']
    DEFAULT 'no_iniciado';

DEFINE FIELD fecha_inicio ON progreso_proof_point TYPE datetime;

DEFINE FIELD fecha_completacion ON progreso_proof_point TYPE datetime;

DEFINE FIELD score_final ON progreso_proof_point TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD tiempo_total_minutos ON progreso_proof_point TYPE int
    DEFAULT 0;

-- Timestamps
DEFINE FIELD created_at ON progreso_proof_point TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON progreso_proof_point TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX progPPEstudianteIdx ON progreso_proof_point FIELDS estudiante;
DEFINE INDEX progPPProofPointIdx ON progreso_proof_point FIELDS proof_point;
DEFINE INDEX progPPEstadoIdx ON progreso_proof_point FIELDS estado;

-- ----------------------------------------------------------------------------
-- TABLA: progreso_nivel
-- Descripción: Progreso de estudiantes en Niveles
-- ----------------------------------------------------------------------------
DEFINE TABLE progreso_nivel SCHEMAFULL;

DEFINE FIELD progreso_proof_point ON progreso_nivel TYPE record<progreso_proof_point>
    ASSERT $value != NONE;

DEFINE FIELD nivel ON progreso_nivel TYPE record<nivel>
    ASSERT $value != NONE;

DEFINE FIELD estado ON progreso_nivel TYPE string
    ASSERT $value IN ['no_iniciado', 'en_progreso', 'completado']
    DEFAULT 'no_iniciado';

DEFINE FIELD progreso_porcentaje ON progreso_nivel TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD fecha_inicio ON progreso_nivel TYPE datetime;

DEFINE FIELD fecha_completacion ON progreso_nivel TYPE datetime;

-- Timestamps
DEFINE FIELD created_at ON progreso_nivel TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON progreso_nivel TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX progNivelProgPPIdx ON progreso_nivel FIELDS progreso_proof_point;
DEFINE INDEX progNivelNivelIdx ON progreso_nivel FIELDS nivel;
DEFINE INDEX progNivelEstadoIdx ON progreso_nivel FIELDS estado;

-- ----------------------------------------------------------------------------
-- TABLA: progreso_componente
-- Descripción: Progreso de estudiantes en Componentes
-- ----------------------------------------------------------------------------
DEFINE TABLE progreso_componente SCHEMAFULL;

DEFINE FIELD progreso_nivel ON progreso_componente TYPE record<progreso_nivel>
    ASSERT $value != NONE;

DEFINE FIELD estudiante ON progreso_componente TYPE record<estudiante>
    ASSERT $value != NONE;

DEFINE FIELD componente ON progreso_componente TYPE record<componente>
    ASSERT $value != NONE;

DEFINE FIELD estado ON progreso_componente TYPE string
    ASSERT $value IN ['no_iniciado', 'en_progreso', 'completado', 'bloqueado']
    DEFAULT 'no_iniciado';

DEFINE FIELD intentos ON progreso_componente TYPE int
    DEFAULT 0;

DEFINE FIELD tiempo_invertido_minutos ON progreso_componente TYPE int
    DEFAULT 0;

DEFINE FIELD score ON progreso_componente TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD fecha_inicio ON progreso_componente TYPE datetime;

DEFINE FIELD fecha_completacion ON progreso_componente TYPE datetime;

DEFINE FIELD ultima_actividad ON progreso_componente TYPE datetime;

-- Timestamps
DEFINE FIELD created_at ON progreso_componente TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD updated_at ON progreso_componente TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX progCompNivelIdx ON progreso_componente FIELDS progreso_nivel;
DEFINE INDEX progCompEstudianteIdx ON progreso_componente FIELDS estudiante;
DEFINE INDEX progCompComponenteIdx ON progreso_componente FIELDS componente;
DEFINE INDEX progCompEstadoIdx ON progreso_componente FIELDS estado;

-- ----------------------------------------------------------------------------
-- TABLA: datos_estudiante
-- Descripción: Datos generados por estudiantes en componentes (polimórfico)
-- ----------------------------------------------------------------------------
DEFINE TABLE datos_estudiante SCHEMAFULL;

DEFINE FIELD progreso_componente ON datos_estudiante TYPE record<progreso_componente>
    ASSERT $value != NONE;

DEFINE FIELD tipo ON datos_estudiante TYPE string
    ASSERT $value IN ['respuestas_cuaderno', 'mensajes_simulacion', 'output_herramienta', 'notas', 'reflexion'];

-- Datos polimórficos según el tipo
DEFINE FIELD datos ON datos_estudiante TYPE object
    ASSERT $value != NONE;

DEFINE FIELD version ON datos_estudiante TYPE int
    DEFAULT 1;

DEFINE FIELD guardado_at ON datos_estudiante TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX datosEstProgCompIdx ON datos_estudiante FIELDS progreso_componente;
DEFINE INDEX datosEstTipoIdx ON datos_estudiante FIELDS tipo;

-- ----------------------------------------------------------------------------
-- TABLA: evaluacion_resultado
-- Descripción: Resultados de evaluaciones de componentes
-- ----------------------------------------------------------------------------
DEFINE TABLE evaluacion_resultado SCHEMAFULL;

DEFINE FIELD progreso_componente ON evaluacion_resultado TYPE record<progreso_componente>
    ASSERT $value != NONE;

DEFINE FIELD score_general ON evaluacion_resultado TYPE float
    ASSERT $value >= 0 AND $value <= 100;

-- Scores por dimensión de la rúbrica
DEFINE FIELD scores_por_dimension ON evaluacion_resultado TYPE object
    DEFAULT {};

DEFINE FIELD analisis_cualitativo ON evaluacion_resultado TYPE string;

DEFINE FIELD evaluado_por ON evaluacion_resultado TYPE string
    ASSERT $value IN ['ai', 'instructor', 'auto', 'peer'];

DEFINE FIELD evaluador ON evaluacion_resultado TYPE record<user>;

DEFINE FIELD evaluado_at ON evaluacion_resultado TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX evalResultProgCompIdx ON evaluacion_resultado FIELDS progreso_componente;
DEFINE INDEX evalResultEvaluadorIdx ON evaluacion_resultado FIELDS evaluador;

-- ----------------------------------------------------------------------------
-- TABLA: feedback_generado
-- Descripción: Feedback generado para evaluaciones
-- ----------------------------------------------------------------------------
DEFINE TABLE feedback_generado SCHEMAFULL;

DEFINE FIELD evaluacion_resultado ON feedback_generado TYPE record<evaluacion_resultado>
    ASSERT $value != NONE;

DEFINE FIELD feedback_texto ON feedback_generado TYPE string
    ASSERT $value != NONE;

-- Arrays de highlights y áreas de mejora
DEFINE FIELD highlights_positivos ON feedback_generado TYPE array
    DEFAULT [];

DEFINE FIELD areas_mejora ON feedback_generado TYPE array
    DEFAULT [];

DEFINE FIELD siguientes_pasos ON feedback_generado TYPE array
    DEFAULT [];

DEFINE FIELD recursos_recomendados ON feedback_generado TYPE array
    DEFAULT [];

DEFINE FIELD tono ON feedback_generado TYPE string
    DEFAULT 'constructivo';

-- Timestamps
DEFINE FIELD created_at ON feedback_generado TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Índices
DEFINE INDEX feedbackEvalIdx ON feedback_generado FIELDS evaluacion_resultado UNIQUE;
