#!/usr/bin/env tsx
/**
 * Script para aplicar la migración instructor_scope
 *
 * Uso:
 *   pnpm tsx apply-migration.ts
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
  log('APLICANDO MIGRACIÓN: instructor_scope', 'cyan');
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
    const migrationPath = join(__dirname, 'migrations', 'add-instructor-scope.surql');
    log(`📄 Leyendo migración desde: ${migrationPath}`, 'cyan');
    const migration = readFileSync(migrationPath, 'utf8');

    // Aplicar migración
    log('⚙️  Aplicando migración...\n', 'cyan');
    const result = await db.query(migration);

    log('✓ Migración aplicada exitosamente\n', 'green');

    // Verificar que el scope existe
    log('🔍 Verificando que instructor_scope existe...', 'cyan');
    const infoResult = await db.query('INFO FOR DB;');
    const dbInfo = infoResult[0] as any;

    if (dbInfo && dbInfo.scopes && dbInfo.scopes.instructor_scope) {
      log('✓ instructor_scope encontrado en la base de datos\n', 'green');
    } else {
      log('⚠️  instructor_scope no encontrado. Revisa los resultados manualmente.\n', 'yellow');
    }

    // Verificar que el usuario instructor existe
    log('👤 Verificando usuario instructor...', 'cyan');
    const userResult = await db.query("SELECT * FROM user WHERE email = 'instructor@xpertia.com';");
    const users = userResult[0] as any[];

    if (users && users.length > 0) {
      const user = users[0];
      log(`✓ Usuario instructor encontrado: ${user.email}`, 'green');
      log(`   Rol: ${user.rol}`, 'green');
      log(`   Activo: ${user.activo}\n`, 'green');
    } else {
      log('⚠️  Usuario instructor no encontrado', 'yellow');
      log('   Puedes crearlo ejecutando:', 'yellow');
      log(`   CREATE user:instructor SET`, 'yellow');
      log(`     email = 'instructor@xpertia.com',`, 'yellow');
      log(`     nombre = 'Instructor Demo',`, 'yellow');
      log(`     password_hash = crypto::argon2::generate('Instructor123!'),`, 'yellow');
      log(`     rol = 'instructor',`, 'yellow');
      log(`     activo = true;\n`, 'yellow');
    }

    log('='.repeat(80), 'cyan');
    log('✅ MIGRACIÓN COMPLETADA', 'green');
    log('='.repeat(80) + '\n', 'cyan');

    log('📝 Próximos pasos:', 'cyan');
    log('1. Verifica que las variables de entorno del backend sean correctas', 'cyan');
    log('   apps/api/.env debe tener:', 'cyan');
    log(`   SURREAL_URL=${SURREAL_URL}`, 'cyan');
    log(`   SURREAL_NAMESPACE=${SURREAL_NS}`, 'cyan');
    log(`   SURREAL_DATABASE=${SURREAL_DB}`, 'cyan');
    log(`   SURREAL_USER=${SURREAL_USER}`, 'cyan');
    log(`   SURREAL_PASS=${SURREAL_PASS}`, 'cyan');
    log('', 'reset');
    log('2. Reinicia el backend (pnpm dev en apps/api)', 'cyan');
    log('3. Intenta hacer login desde el frontend', 'cyan');
    log('4. El error "Usuario no encontrado" debería estar resuelto\n', 'cyan');

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
