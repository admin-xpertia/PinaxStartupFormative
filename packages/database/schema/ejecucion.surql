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
DEFINE TABLE IF NOT EXISTS estudiante SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS user ON estudiante TYPE record<user>
    ASSERT $value != NONE;

-- Metadata del estudiante (preferencias de aprendizaje, nivel, etc.)
DEFINE FIELD IF NOT EXISTS metadata ON estudiante TYPE object
    DEFAULT {};

DEFINE FIELD IF NOT EXISTS fecha_nacimiento ON estudiante TYPE datetime;

DEFINE FIELD IF NOT EXISTS pais ON estudiante TYPE string;

DEFINE FIELD IF NOT EXISTS ciudad ON estudiante TYPE string;

DEFINE FIELD IF NOT EXISTS nivel_educativo ON estudiante TYPE string;

DEFINE FIELD IF NOT EXISTS intereses ON estudiante TYPE array
    DEFAULT [];

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON estudiante TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON estudiante TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS estudianteUserIdx ON estudiante FIELDS user UNIQUE;

-- ----------------------------------------------------------------------------
-- TABLA: inscripcion_cohorte
-- Descripción: Inscripciones de estudiantes en cohortes
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS inscripcion_cohorte SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS estudiante ON inscripcion_cohorte TYPE record<estudiante>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS cohorte ON inscripcion_cohorte TYPE record<cohorte>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS estado ON inscripcion_cohorte TYPE string
    ASSERT $value IN ['activo', 'pausado', 'completado', 'abandonado']
    DEFAULT 'activo';

DEFINE FIELD IF NOT EXISTS fecha_inscripcion ON inscripcion_cohorte TYPE datetime
    DEFAULT time::now();

DEFINE FIELD IF NOT EXISTS fecha_finalizacion ON inscripcion_cohorte TYPE datetime;

DEFINE FIELD IF NOT EXISTS motivo_pausa ON inscripcion_cohorte TYPE string;

DEFINE FIELD IF NOT EXISTS progreso_general ON inscripcion_cohorte TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON inscripcion_cohorte TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON inscripcion_cohorte TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS inscripcionEstudianteIdx ON inscripcion_cohorte FIELDS estudiante;
DEFINE INDEX IF NOT EXISTS inscripcionCohorteIdx ON inscripcion_cohorte FIELDS cohorte;
DEFINE INDEX IF NOT EXISTS inscripcionEstadoIdx ON inscripcion_cohorte FIELDS estado;

-- ----------------------------------------------------------------------------
-- TABLA: progreso_proof_point
-- Descripción: Progreso de estudiantes en Proof Points
-- ----------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS progreso_proof_point SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS estudiante ON progreso_proof_point TYPE record<estudiante>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS proof_point ON progreso_proof_point TYPE record<proof_point>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS estado ON progreso_proof_point TYPE string
    ASSERT $value IN ['no_iniciado', 'en_progreso', 'completado']
    DEFAULT 'no_iniciado';

DEFINE FIELD IF NOT EXISTS fecha_inicio ON progreso_proof_point TYPE datetime;

DEFINE FIELD IF NOT EXISTS fecha_completacion ON progreso_proof_point TYPE datetime;

DEFINE FIELD IF NOT EXISTS score_final ON progreso_proof_point TYPE float
    DEFAULT 0.0
    ASSERT $value >= 0 AND $value <= 100;

DEFINE FIELD IF NOT EXISTS tiempo_total_minutos ON progreso_proof_point TYPE int
    DEFAULT 0;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON progreso_proof_point TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON progreso_proof_point TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Índices
DEFINE INDEX IF NOT EXISTS progPPEstudianteIdx ON progreso_proof_point FIELDS estudiante;
DEFINE INDEX IF NOT EXISTS progPPProofPointIdx ON progreso_proof_point FIELDS proof_point;
DEFINE INDEX IF NOT EXISTS progPPEstadoIdx ON progreso_proof_point FIELDS estado;

-- ============================================================================
-- LEGACY TABLES REMOVED
-- ============================================================================
-- The following tables were removed as part of the migration to the new
-- simplified 3-level hierarchy (Programa → Fase → ProofPoint → ExerciseInstance):
-- - progreso_nivel (lines 127-162)
-- - progreso_componente (lines 164-212)
-- - datos_estudiante (lines 214-239)
-- - evaluacion_resultado (lines 241-270)
-- - feedback_generado (lines 272-306)
--
-- See migrations/001-remove-nivel-componente-tables.surql for details.
-- See LEGACY_CLEANUP.md for the complete migration guide.
-- ============================================================================
