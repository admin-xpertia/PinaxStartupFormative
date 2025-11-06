# Database Migrations

This directory contains database migrations for the Xpertia Platform.

## Overview

Migrations are numbered sequentially and should be applied in order. Each migration file is a SurrealDB script (.surql) that can be executed directly against the database.

## Migration History

### 001 - Remove nivel and componente tables (2025-11-06)
**Type:** Breaking change
**Description:** Removes the `nivel` and `componente` tables along with their related tables (`progreso_nivel`, `progreso_componente`, `prerequisitos_componente`, `datos_estudiante`, `evaluacion_resultado`, `feedback_generado`).

**Reason:** The platform architecture was simplified from a 5-level hierarchy (Programa → Fase → ProofPoint → Nivel → Componente) to a 3-level hierarchy (Programa → Fase → ProofPoint → ExerciseInstance).

**Affected tables:**
- `nivel` (removed)
- `componente` (removed)
- `prerequisitos_componente` (removed)
- `progreso_nivel` (removed)
- `progreso_componente` (removed)
- `datos_estudiante` (removed)
- `evaluacion_resultado` (removed)
- `feedback_generado` (removed)

**Replacement:** New `exercise_*` tables provide a flexible, template-based system with 10 exercise types.

---

### 002 - Remove snapshot tables (2025-11-06)
**Type:** Breaking change
**Description:** Removes all 7 snapshot tables that were used for content versioning.

**Reason:** The snapshot system added unnecessary complexity. The new architecture stores generated content directly in `exercise_content` with references to the exercise instance. Regeneration is simple via API calls.

**Affected tables:**
- `snapshot_programa` (removed)
- `snapshot_fase` (removed)
- `snapshot_proofpoint` (removed)
- `snapshot_nivel` (removed)
- `snapshot_componente` (removed)
- `snapshot_contenido` (removed)
- `snapshot_rubrica` (removed)

**Replacement:** Content stored directly in `exercise_content` with `prompt_usado` field for regeneration.

---

## How to Apply Migrations

### Option 1: Manual execution via SurrealDB CLI

```bash
# Navigate to migrations directory
cd packages/database/migrations

# Apply migration 001
surreal sql --endpoint http://localhost:8000 --namespace xpertia --database main --auth-level root --username root --password root < 001-remove-nivel-componente-tables.surql

# Apply migration 002
surreal sql --endpoint http://localhost:8000 --namespace xpertia --database main --auth-level root --username root --password root < 002-remove-snapshot-tables.surql
```

### Option 2: Using pnpm scripts (TODO: implement)

```bash
# Run all pending migrations
pnpm db:migrate

# Rollback last migration (if rollback scripts are implemented)
pnpm db:migrate:rollback
```

## Before Running Migrations

⚠️ **WARNING**: These migrations are **destructive** and will permanently delete data.

Before running any migration:

1. **Backup your database:**
   ```bash
   surreal export --endpoint http://localhost:8000 --namespace xpertia --database main --auth-level root --username root --password root backup.surql
   ```

2. **Review the migration file** to understand what will be changed

3. **Test in a development environment** first

4. **Verify no active users** are depending on the tables being removed

5. **Communicate the change** to your team

## Rolling Back Migrations

Currently, these migrations do not have automatic rollback scripts because:

1. They are destructive (data loss)
2. The old architecture is being completely replaced
3. Rollback would require restoring from backup

If you need to rollback:
1. Restore from your backup
2. Do not apply the migration

## Migration Checklist

When creating new migrations:

- [ ] Number sequentially (001, 002, etc.)
- [ ] Include clear description and date
- [ ] Mark breaking changes clearly
- [ ] Document affected tables
- [ ] Explain the reason for the change
- [ ] Include notes on replacement functionality
- [ ] Test in development first
- [ ] Add entry to this README

## Additional Notes

### Migrations vs Schema Files

- **Schema files** (`schema/*.surql`): Define the current state of the database
- **Migration files** (`migrations/*.surql`): Define transitions between states

After applying all migrations, the schema files should reflect the final state of the database.

### Future Improvements

Consider implementing:
- Automated migration runner
- Migration state tracking (which migrations have been applied)
- Rollback scripts for reversible migrations
- Migration testing framework
- Pre-migration validation checks
