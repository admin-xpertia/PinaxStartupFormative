-- ============================================================================
-- MIGRATION 002: SIMPLIFY SCHEMA TO DDD ARCHITECTURE
-- ============================================================================
-- This migration removes legacy and complex tables to simplify to ~20 core tables
-- Date: 2025-11-06
-- See: /DDD_ARCHITECTURE.md for full architecture
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: REMOVE LEGACY VERSIONING TABLES (Save disk space, simplify)
-- ----------------------------------------------------------------------------

-- Remove version_contenido (references legacy componente)
REMOVE TABLE IF EXISTS version_contenido;

-- Remove cambio_contenido
REMOVE TABLE IF EXISTS cambio_contenido;

-- Remove comparacion_version
REMOVE TABLE IF EXISTS comparacion_version;

-- Remove rollback_historia (references legacy componente)
REMOVE TABLE IF EXISTS rollback_historia;

-- Remove aprobacion_version
REMOVE TABLE IF EXISTS aprobacion_version;

-- Remove conflicto_version (references legacy componente)
REMOVE TABLE IF EXISTS conflicto_version;

-- ----------------------------------------------------------------------------
-- STEP 2: REMOVE PORTAFOLIO TABLES (Defer to Phase 2)
-- ----------------------------------------------------------------------------

-- Remove portafolio tables (will be re-added in future phase)
REMOVE TABLE IF EXISTS portafolio;
REMOVE TABLE IF EXISTS reporte_integral;
REMOVE TABLE IF EXISTS artefacto;
REMOVE TABLE IF EXISTS shared_portfolio_link;
REMOVE TABLE IF EXISTS vista_portafolio;
REMOVE TABLE IF EXISTS badge;
REMOVE TABLE IF EXISTS estudiante_badge;

-- ----------------------------------------------------------------------------
-- STEP 3: UPDATE TABLES TO REMOVE LEGACY REFERENCES
-- ----------------------------------------------------------------------------

-- rubrica_evaluacion: Remove legacy componente field (already deprecated)
-- This table will be updated to reference exercise_instance in future migration
-- For now, just leave it as-is but documented as deprecated

-- ----------------------------------------------------------------------------
-- STEP 4: ADD MISSING FIELDS TO EXERCISE PROGRESS
-- ----------------------------------------------------------------------------

-- Merge evaluacion_resultado functionality into exercise_progress
-- exercise_progress already has score_final, so we're good there

-- Add feedback field to exercise_progress (replaces feedback_generado)
DEFINE FIELD IF NOT EXISTS feedback_ia ON exercise_progress TYPE option<string>;

-- Add evaluacion_detalles (replaces evaluacion_resultado.detalles_evaluacion)
DEFINE FIELD IF NOT EXISTS evaluacion_detalles ON exercise_progress TYPE option<object>;

-- Add ultima_interaccion timestamp
DEFINE FIELD IF NOT EXISTS ultima_interaccion ON exercise_progress TYPE option<datetime>;

-- ----------------------------------------------------------------------------
-- STEP 5: ADD GENERATION REQUEST SUPPORT FOR NEW EXERCISE SYSTEM
-- ----------------------------------------------------------------------------

-- Update generacion_request to support exercise_instance
-- Already supported in schema - no changes needed

-- ----------------------------------------------------------------------------
-- STEP 6: SIMPLIFY SNAPSHOT SYSTEM
-- ----------------------------------------------------------------------------

-- snapshot_programa is KEPT but simplified
-- It will store full JSON snapshot on cohort creation (copy-on-cohort)
-- No changes needed to table structure

-- ----------------------------------------------------------------------------
-- STEP 7: ADD DATOS_ESTUDIANTE TABLE (If not exists)
-- ----------------------------------------------------------------------------

-- This table stores student interaction data (answers, outputs, etc.)
DEFINE TABLE IF NOT EXISTS datos_estudiante SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE AND (estudiante = $auth OR estudiante = $auth.id OR $auth.rol IN ['instructor', 'admin'])
    FOR create WHERE $auth != NONE AND estudiante = $auth.id
    FOR update WHERE $auth != NONE AND (estudiante = $auth OR estudiante = $auth.id)
    FOR delete WHERE $auth != NONE AND $auth.rol = 'admin';

DEFINE FIELD IF NOT EXISTS estudiante ON datos_estudiante TYPE record<estudiante>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS exercise_instance ON datos_estudiante TYPE record<exercise_instance>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS cohorte ON datos_estudiante TYPE record<cohorte>
    ASSERT $value != NONE;

-- The actual data/outputs from student interaction
DEFINE FIELD IF NOT EXISTS datos ON datos_estudiante TYPE object
    DEFAULT {};

-- Type of data (answers, submission, output, etc.)
DEFINE FIELD IF NOT EXISTS tipo_datos ON datos_estudiante TYPE string
    ASSERT $value IN ['respuestas', 'submission', 'output', 'interaccion', 'artefacto', 'otro']
    DEFAULT 'otro';

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON datos_estudiante TYPE datetime
    DEFAULT time::now()
    READONLY;

DEFINE FIELD IF NOT EXISTS updated_at ON datos_estudiante TYPE datetime
    DEFAULT time::now()
    VALUE time::now();

-- Indices
DEFINE INDEX IF NOT EXISTS datosEstudianteIdx ON datos_estudiante FIELDS estudiante, exercise_instance;
DEFINE INDEX IF NOT EXISTS datosCohortIdx ON datos_estudiante FIELDS cohorte;

-- ----------------------------------------------------------------------------
-- STEP 8: ADD EVALUACION_RESULTADO TABLE (If not exists)
-- ----------------------------------------------------------------------------

-- Evaluation results for exercises
DEFINE TABLE IF NOT EXISTS evaluacion_resultado SCHEMAFULL PERMISSIONS
    FOR select WHERE $auth != NONE AND (estudiante = $auth OR estudiante = $auth.id OR $auth.rol IN ['instructor', 'admin'])
    FOR create WHERE $auth != NONE
    FOR update WHERE $auth != NONE AND $auth.rol IN ['instructor', 'admin']
    FOR delete WHERE $auth != NONE AND $auth.rol = 'admin';

DEFINE FIELD IF NOT EXISTS exercise_progress ON evaluacion_resultado TYPE record<exercise_progress>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS estudiante ON evaluacion_resultado TYPE record<estudiante>
    ASSERT $value != NONE;

DEFINE FIELD IF NOT EXISTS tipo_evaluacion ON evaluacion_resultado TYPE string
    ASSERT $value IN ['automatica', 'ia', 'instructor', 'par']
    DEFAULT 'automatica';

-- Score 0-100
DEFINE FIELD IF NOT EXISTS score ON evaluacion_resultado TYPE float
    ASSERT $value >= 0 AND $value <= 100;

-- Detailed evaluation breakdown
DEFINE FIELD IF NOT EXISTS detalles_evaluacion ON evaluacion_resultado TYPE object
    DEFAULT {};

-- AI or instructor feedback
DEFINE FIELD IF NOT EXISTS feedback ON evaluacion_resultado TYPE string;

-- Evaluator (if instructor or peer)
DEFINE FIELD IF NOT EXISTS evaluador ON evaluacion_resultado TYPE option<record<user>>;

-- Timestamps
DEFINE FIELD IF NOT EXISTS created_at ON evaluacion_resultado TYPE datetime
    DEFAULT time::now()
    READONLY;

-- Indices
DEFINE INDEX IF NOT EXISTS evalProgressIdx ON evaluacion_resultado FIELDS exercise_progress;
DEFINE INDEX IF NOT EXISTS evalEstudianteIdx ON evaluacion_resultado FIELDS estudiante;

-- ----------------------------------------------------------------------------
-- SUMMARY
-- ----------------------------------------------------------------------------
-- Tables REMOVED: 13
--   - version_contenido
--   - cambio_contenido
--   - comparacion_version
--   - rollback_historia
--   - aprobacion_version
--   - conflicto_version
--   - portafolio
--   - reporte_integral
--   - artefacto
--   - shared_portfolio_link
--   - vista_portafolio
--   - badge
--   - estudiante_badge
--
-- Tables MODIFIED: 1
--   - exercise_progress (added feedback_ia, evaluacion_detalles, ultima_interaccion)
--
-- Tables ADDED: 0 (all already exist)
--
-- FINAL COUNT: ~20 core tables
-- ============================================================================
