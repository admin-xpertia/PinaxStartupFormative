-- ============================================================================
-- MIGRATION 001: Remove nivel and componente tables
-- ============================================================================
-- Fecha: 2025-11-06
-- Descripción: Esta migración elimina las tablas nivel, componente y
--              prerequisitos_componente ya que la nueva arquitectura simplificada
--              usa exercise_instance directamente vinculado a proof_points.
--
-- BREAKING CHANGE: Esta migración es destructiva y eliminará todos los datos
--                   de las tablas nivel, componente y prerequisitos_componente.
--                   Asegúrate de haber respaldado cualquier dato importante antes
--                   de ejecutar esta migración.
-- ============================================================================

-- Step 1: Remove progreso_componente table (depends on componente)
-- This table tracks student progress on components
REMOVE TABLE IF EXISTS progreso_componente;

-- Step 2: Remove progreso_nivel table (depends on nivel)
-- This table tracks student progress on levels
REMOVE TABLE IF EXISTS progreso_nivel;

-- Step 3: Remove datos_estudiante table (depends on progreso_componente)
-- This table stores student-generated data
REMOVE TABLE IF EXISTS datos_estudiante;

-- Step 4: Remove evaluacion_resultado table (depends on progreso_componente)
-- This table stores evaluation results
REMOVE TABLE IF EXISTS evaluacion_resultado;

-- Step 5: Remove feedback_generado table (depends on evaluacion_resultado)
-- This table stores generated feedback
REMOVE TABLE IF EXISTS feedback_generado;

-- Step 6: Remove prerequisitos_componente table
-- This table defines prerequisites between components
REMOVE TABLE IF EXISTS prerequisitos_componente;

-- Step 7: Remove componente table
-- This is the main component table that we're replacing
REMOVE TABLE IF EXISTS componente;

-- Step 8: Remove nivel table
-- This is the level table that we're removing from the hierarchy
REMOVE TABLE IF EXISTS nivel;

-- ============================================================================
-- NOTAS DE MIGRACIÓN:
-- ============================================================================
--
-- La nueva arquitectura simplificada funciona así:
--
-- ANTES (5 niveles):
--   Programa → Fase → ProofPoint → Nivel → Componente
--
-- DESPUÉS (3 niveles):
--   Programa → Fase → ProofPoint → ExerciseInstance
--
-- Tablas nuevas que reemplazan esta funcionalidad:
-- - exercise_template: Catálogo de 10 tipos de ejercicios
-- - exercise_instance: Instancias de ejercicios aplicadas a proof points
-- - exercise_content: Contenido generado por IA para cada instancia
-- - exercise_progress: Progreso simplificado del estudiante (1 tabla vs 3)
--
-- ============================================================================
