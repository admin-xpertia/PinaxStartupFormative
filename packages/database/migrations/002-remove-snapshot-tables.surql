-- ============================================================================
-- MIGRATION 002: Remove snapshot tables
-- ============================================================================
-- Fecha: 2025-11-06
-- Descripción: Esta migración elimina las 7 tablas del sistema de snapshots
--              (snapshot_programa, snapshot_fase, snapshot_proofpoint,
--              snapshot_nivel, snapshot_componente, snapshot_contenido,
--              snapshot_rubrica).
--
--              El sistema de snapshots fue diseñado para versionar contenido
--              generado, pero añadía complejidad innecesaria. En la nueva
--              arquitectura, el contenido generado se almacena directamente
--              en exercise_content con referencia a la instancia del ejercicio.
--
-- BREAKING CHANGE: Esta migración es destructiva y eliminará todos los snapshots
--                   versionados. Si necesitas preservar versiones históricas,
--                   exporta los datos antes de ejecutar esta migración.
-- ============================================================================

-- Step 1: Remove snapshot_rubrica table
-- This table stores rubric snapshots
REMOVE TABLE IF EXISTS snapshot_rubrica;

-- Step 2: Remove snapshot_contenido table
-- This table stores content snapshots
REMOVE TABLE IF EXISTS snapshot_contenido;

-- Step 3: Remove snapshot_componente table
-- This table stores component snapshots (depends on snapshot_nivel)
REMOVE TABLE IF EXISTS snapshot_componente;

-- Step 4: Remove snapshot_nivel table
-- This table stores level snapshots (depends on snapshot_proofpoint)
REMOVE TABLE IF EXISTS snapshot_nivel;

-- Step 5: Remove snapshot_proofpoint table
-- This table stores proof point snapshots (depends on snapshot_fase)
REMOVE TABLE IF EXISTS snapshot_proofpoint;

-- Step 6: Remove snapshot_fase table
-- This table stores phase snapshots (depends on snapshot_programa)
REMOVE TABLE IF EXISTS snapshot_fase;

-- Step 7: Remove snapshot_programa table
-- This table stores program snapshots (root of snapshot hierarchy)
REMOVE TABLE IF EXISTS snapshot_programa;

-- ============================================================================
-- NOTAS DE MIGRACIÓN:
-- ============================================================================
--
-- El sistema de snapshots fue eliminado porque:
--
-- 1. COMPLEJIDAD INNECESARIA:
--    - 7 tablas adicionales solo para versionar
--    - Duplicación completa de la jerarquía de contenido
--    - Difícil de mantener sincronizado con cambios en el esquema principal
--
-- 2. NUEVO ENFOQUE:
--    - exercise_content almacena el contenido generado directamente
--    - El prompt usado se guarda en exercise_content.prompt_usado
--    - Si se necesita regenerar, simplemente se llama nuevamente a la API
--    - Historial se puede rastrear via created_at/updated_at timestamps
--
-- 3. ALTERNATIVAS SI SE NECESITA VERSIONADO:
--    - Implementar soft deletes con timestamps
--    - Usar campos de auditoría (created_by, updated_by, version_number)
--    - Almacenar diffs en lugar de snapshots completos
--    - Usar sistemas de backup de base de datos a nivel de infraestructura
--
-- ============================================================================
