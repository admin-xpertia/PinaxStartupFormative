# Field Name Migration Guide

## Problem

There was a mismatch between the database schema field names and the application code field names, causing validation errors when creating fases and proof points.

### Errors Fixed:
- `Found NONE for field 'duracion_semanas', with record 'fase:⟨...⟩', but expected a number`
- Empty query results when fetching program characteristics

## Changes Made

### Schema Field Renames

**fase table:**
- `duracion_semanas` → `duracion_semanas_estimada`

**proof_point table:**
- `duracion_horas` → `duracion_estimada_horas`

**snapshot_fase table:**
- Added: `duracion_semanas_estimada`

**snapshot_proofpoint table:**
- `duracion_horas` → `duracion_estimada_horas`

## How to Apply the Migration

### Option 1: Run the Migration Script (Recommended)

This script updates the field definitions without dropping data:

```bash
cd packages/database
pnpm install
pnpm tsx migrate-field-names.ts
```

### Option 2: Reapply the Schema

Since the schema files have been updated, you can reapply them:

```bash
cd packages/database
pnpm run migrate:confirm
```

**Warning:** This will delete all existing data. Only use this in development environments.

### Option 3: Manual Migration

If you need to preserve data and want more control, you can run these SurrealDB queries manually:

```sql
-- Connect to your database
USE NS xpertia DB plataforma;

-- Update fase table
REMOVE FIELD duracion_semanas ON fase;
DEFINE FIELD duracion_semanas_estimada ON fase TYPE number ASSERT $value > 0;

-- Update proof_point table
REMOVE FIELD duracion_horas ON proof_point;
DEFINE FIELD duracion_estimada_horas ON proof_point TYPE number ASSERT $value > 0;

-- Update snapshot_fase table
DEFINE FIELD duracion_semanas_estimada ON snapshot_fase TYPE option<number>;

-- Update snapshot_proofpoint table
REMOVE FIELD duracion_horas ON snapshot_proofpoint;
DEFINE FIELD duracion_estimada_horas ON snapshot_proofpoint TYPE option<number>;
```

## After Migration

1. Restart your API server
2. Test creating a new program with fases and proof points
3. Verify that existing programs can be queried successfully
4. Check that the program characteristics/statistics are displayed correctly

## Verification

After applying the migration, verify that:

1. You can create new programs with fases without errors
2. Existing programs display their fases correctly
3. Program statistics (number of fases, proof points) are calculated correctly

## Rollback (if needed)

If you need to rollback these changes (not recommended unless absolutely necessary):

```sql
-- Revert fase table
REMOVE FIELD duracion_semanas_estimada ON fase;
DEFINE FIELD duracion_semanas ON fase TYPE number ASSERT $value > 0;

-- Revert proof_point table
REMOVE FIELD duracion_estimada_horas ON proof_point;
DEFINE FIELD duracion_horas ON proof_point TYPE number ASSERT $value > 0;
```

**Note:** This rollback will only work if you haven't created new data with the new field names.
