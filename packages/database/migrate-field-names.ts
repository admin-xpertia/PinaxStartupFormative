#!/usr/bin/env tsx
/**
 * Migration Script: Update Field Names
 *
 * This script updates the field definitions for fase and proof_point tables
 * to match the application code without dropping existing data.
 *
 * Changes:
 * - fase.duracion_semanas → fase.duracion_semanas_estimada
 * - proof_point.duracion_horas → proof_point.duracion_estimada_horas
 * - snapshot_fase: add duracion_semanas_estimada field
 * - snapshot_proofpoint.duracion_horas → snapshot_proofpoint.duracion_estimada_horas
 */

import Surreal from 'surrealdb.js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = resolve(__dirname, '../../apps/api/.env');
config({ path: envPath });

const SURREAL_URL = process.env.SURREAL_URL || process.env.DATABASE_URL || 'ws://127.0.0.1:8000/rpc';
const SURREAL_USER = process.env.SURREAL_USER || process.env.DATABASE_USER || 'root';
const SURREAL_PASS = process.env.SURREAL_PASS || process.env.DATABASE_PASSWORD || 'root';
const SURREAL_NS = process.env.SURREAL_NAMESPACE || process.env.SURREAL_NS || process.env.DATABASE_NAMESPACE || 'xpertia';
const SURREAL_DB = process.env.SURREAL_DATABASE || process.env.SURREAL_DB || process.env.DATABASE_NAME || 'plataforma';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color?: keyof typeof colors) {
  const colorCode = color ? colors[color] : colors.reset;
  console.log(`${colorCode}${message}${colors.reset}`);
}

async function main() {
  log('\n========================================', 'cyan');
  log('Field Name Migration Script', 'cyan');
  log('========================================\n', 'cyan');

  log('Connecting to SurrealDB...', 'blue');
  log(`  URL: ${SURREAL_URL}`, 'blue');
  log(`  Namespace: ${SURREAL_NS}`, 'blue');
  log(`  Database: ${SURREAL_DB}`, 'blue');

  const db = new Surreal();

  try {
    await db.connect(SURREAL_URL);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: SURREAL_NS, database: SURREAL_DB });

    log('✓ Connected successfully\n', 'green');

    // Step 1: Update fase table field definitions
    log('Step 1: Updating fase table field definitions...', 'blue');

    // Remove old field and define new field
    await db.query('REMOVE FIELD duracion_semanas ON fase;');
    log('  ✓ Removed old field: duracion_semanas', 'green');

    await db.query('DEFINE FIELD duracion_semanas_estimada ON fase TYPE number ASSERT $value > 0;');
    log('  ✓ Defined new field: duracion_semanas_estimada', 'green');

    // Step 2: Update proof_point table field definitions
    log('\nStep 2: Updating proof_point table field definitions...', 'blue');

    await db.query('REMOVE FIELD duracion_horas ON proof_point;');
    log('  ✓ Removed old field: duracion_horas', 'green');

    await db.query('DEFINE FIELD duracion_estimada_horas ON proof_point TYPE number ASSERT $value > 0;');
    log('  ✓ Defined new field: duracion_estimada_horas', 'green');

    // Step 3: Update snapshot_fase table
    log('\nStep 3: Updating snapshot_fase table field definitions...', 'blue');

    await db.query('DEFINE FIELD duracion_semanas_estimada ON snapshot_fase TYPE option<number>;');
    log('  ✓ Added field: duracion_semanas_estimada', 'green');

    // Step 4: Update snapshot_proofpoint table field definitions
    log('\nStep 4: Updating snapshot_proofpoint table field definitions...', 'blue');

    await db.query('REMOVE FIELD duracion_horas ON snapshot_proofpoint;');
    log('  ✓ Removed old field: duracion_horas', 'green');

    await db.query('DEFINE FIELD duracion_estimada_horas ON snapshot_proofpoint TYPE option<number>;');
    log('  ✓ Defined new field: duracion_estimada_horas', 'green');

    log('\n========================================', 'green');
    log('✓ Migration completed successfully!', 'green');
    log('========================================\n', 'green');

    log('Next steps:', 'cyan');
    log('  1. Restart your API server', 'cyan');
    log('  2. Test creating a new program with fases', 'cyan');
    log('  3. Verify that existing programs can be queried\n', 'cyan');

  } catch (error: any) {
    log('\n✗ Migration failed', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.stack) {
      log('\nStack trace:', 'red');
      log(error.stack, 'red');
    }
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
