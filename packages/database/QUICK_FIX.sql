-- =============================================================================
-- QUICK FIX: Update Field Names
-- =============================================================================
-- Run this SQL script in your SurrealDB Cloud console or via CLI
-- This fixes the field name mismatch causing validation errors
-- =============================================================================

-- Use your namespace and database
USE NS StartupFormative DB Roadmap;

-- Update fase table field definitions
REMOVE FIELD duracion_semanas ON fase;
DEFINE FIELD duracion_semanas_estimada ON fase TYPE number ASSERT $value > 0;

-- Update proof_point table field definitions
REMOVE FIELD duracion_horas ON proof_point;
DEFINE FIELD duracion_estimada_horas ON proof_point TYPE number ASSERT $value > 0;

-- Update snapshot_fase table (add new field)
DEFINE FIELD duracion_semanas_estimada ON snapshot_fase TYPE option<number>;

-- Update snapshot_proofpoint table field definitions
REMOVE FIELD duracion_horas ON snapshot_proofpoint;
DEFINE FIELD duracion_estimada_horas ON snapshot_proofpoint TYPE option<number>;

-- =============================================================================
-- After running this script:
-- 1. Restart your API server
-- 2. Try creating a program with fases again
-- 3. The errors should be resolved
-- =============================================================================
