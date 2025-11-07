#!/usr/bin/env tsx
/**
 * Script para aplicar la migración fix-user-permissions
 *
 * Uso:
 *   pnpm tsx apply-fix-permissions.ts
 */

import Surreal from 'surrealdb.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de SurrealDB Cloud
const SURREAL_URL = 'wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud';
const SURREAL_USER = 'admin';
const SURREAL_PASS = 'xpertia123';
const SURREAL_NS = 'StartupFormative';
const SURREAL_DB = 'Roadmap';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message: string, color?: keyof typeof colors) {
  const colorCode = color ? colors[color] : colors.reset;
  console.log(`${colorCode}${message}${colors.reset}`);
}

async function main() {
  log('\n='.repeat(80), 'cyan');
  log('APLICANDO MIGRACIÓN: fix-user-permissions', 'cyan');
  log('='.repeat(80) + '\n', 'cyan');

  const db = new Surreal();

  try {
    // Conectar
    log('📡 Conectando a SurrealDB Cloud...', 'cyan');
    log(`   URL: ${SURREAL_URL}`, 'cyan');
    log(`   Namespace: ${SURREAL_NS}`, 'cyan');
    log(`   Database: ${SURREAL_DB}\n`, 'cyan');

    await db.connect(SURREAL_URL);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: SURREAL_NS, database: SURREAL_DB });

    log('✓ Conectado exitosamente\n', 'green');

    // Leer migración
    const migrationPath = join(__dirname, 'migrations', 'fix-user-permissions.surql');
    log(`📄 Leyendo migración desde: ${migrationPath}`, 'cyan');
    const migration = readFileSync(migrationPath, 'utf8');

    // Aplicar migración
    log('⚙️  Aplicando migración...\n', 'cyan');

    const result = await db.query(migration);
    log('✓ Migración aplicada exitosamente\n', 'green');

    // Verificar los permisos de la tabla user
    log('🔍 Verificando permisos de la tabla user...', 'cyan');
    const infoResult = await db.query('INFO FOR TABLE user;');
    log('📋 Información de la tabla user:', 'cyan');
    console.log(JSON.stringify(infoResult, null, 2));

    log('\n='.repeat(80), 'cyan');
    log('✅ MIGRACIÓN COMPLETADA', 'green');
    log('='.repeat(80) + '\n', 'cyan');

    log('📝 Próximos pasos:', 'cyan');
    log('1. Reinicia el backend (pnpm dev en apps/api)', 'cyan');
    log('2. Intenta hacer login desde el frontend', 'cyan');
    log('3. El error "Usuario no encontrado" debería estar resuelto\n', 'cyan');

  } catch (error: any) {
    log('\n✗ ERROR AL APLICAR MIGRACIÓN', 'red');
    log(error.message, 'red');
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
