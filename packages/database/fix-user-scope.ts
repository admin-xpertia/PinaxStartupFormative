#!/usr/bin/env tsx
/**
 * Script para corregir el user_scope
 *
 * Uso:
 *   pnpm tsx fix-user-scope.ts
 */

import Surreal from 'surrealdb.js';

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
  log('\n' + '='.repeat(80), 'cyan');
  log('CORRIGIENDO user_scope - Validación de rol y estado activo', 'cyan');
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

    // Aplicar corrección del scope
    log('⚙️  Actualizando user_scope con validación completa...\n', 'cyan');

    const scopeDefinition = `
DEFINE SCOPE user_scope SESSION 24h
  SIGNIN (
    SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password_hash, $password) AND rol = 'estudiante' AND activo = true
  )
  SIGNUP (
    CREATE user SET
      email = $email,
      nombre = $nombre,
      password_hash = crypto::argon2::generate($password),
      rol = 'estudiante',
      activo = true
  );
`;

    try {
      await db.query(scopeDefinition);
      log('✓ user_scope actualizado exitosamente\n', 'green');
    } catch (scopeError: any) {
      if (scopeError.message.includes('already exists')) {
        log('ℹ️  user_scope ya existe, redefiniéndolo...\n', 'yellow');
        await db.query(scopeDefinition);
        log('✓ user_scope redefinido exitosamente\n', 'green');
      } else {
        throw scopeError;
      }
    }

    // Verificar que el scope existe
    log('🔍 Verificando que user_scope existe...', 'cyan');
    const infoResult = await db.query('INFO FOR DB;');
    const dbInfo = infoResult[0] as any;

    if (dbInfo && dbInfo.scopes && dbInfo.scopes.user_scope) {
      log('✓ user_scope encontrado en la base de datos\n', 'green');
      log('   Definición actual:', 'cyan');
      log(`   ${JSON.stringify(dbInfo.scopes.user_scope, null, 2)}\n`, 'cyan');
    } else {
      log('⚠️  user_scope no encontrado. Revisa los resultados manualmente.\n', 'yellow');
    }

    // Verificar que el usuario estudiante existe
    log('👤 Verificando usuario estudiante...', 'cyan');
    const userResult = await db.query("SELECT * FROM user WHERE email = 'estudiante@xpertia.com';");
    const users = userResult[0] as any[];

    if (users && users.length > 0) {
      const user = users[0];
      log(`✓ Usuario estudiante encontrado:`, 'green');
      log(`   Email: ${user.email}`, 'green');
      log(`   Nombre: ${user.nombre}`, 'green');
      log(`   Rol: ${user.rol}`, 'green');
      log(`   Activo: ${user.activo}`, 'green');
      log(`   ID: ${user.id}\n`, 'green');
    } else {
      log('⚠️  Usuario estudiante no encontrado\n', 'yellow');
    }

    // Verificar que existe el perfil de estudiante
    log('📋 Verificando perfil de estudiante...', 'cyan');
    const estudianteResult = await db.query("SELECT * FROM estudiante WHERE user.email = 'estudiante@xpertia.com';");
    const estudiantes = estudianteResult[0] as any[];

    if (estudiantes && estudiantes.length > 0) {
      const estudiante = estudiantes[0];
      log(`✓ Perfil de estudiante encontrado:`, 'green');
      log(`   ID: ${estudiante.id}`, 'green');
      log(`   Usuario: ${estudiante.user}\n`, 'green');
    } else {
      log('ℹ️  Perfil de estudiante no encontrado (se creará al hacer login)\n', 'yellow');
    }

    log('='.repeat(80), 'cyan');
    log('✅ CORRECCIÓN COMPLETADA', 'green');
    log('='.repeat(80) + '\n', 'cyan');

    log('📝 Próximos pasos:', 'cyan');
    log('', 'reset');
    log('1. Limpia el localStorage del navegador:', 'cyan');
    log('   - Abre DevTools (F12)', 'cyan');
    log('   - Consola: localStorage.clear()', 'cyan');
    log('   - Recarga la página', 'cyan');
    log('', 'reset');
    log('2. Navega a http://localhost:3002', 'cyan');
    log('   - Debes ser redirigido a /login', 'cyan');
    log('', 'reset');
    log('3. Haz login con:', 'cyan');
    log('   - Email: estudiante@xpertia.com', 'cyan');
    log('   - Password: Estudiante123!', 'cyan');
    log('', 'reset');
    log('4. El login debería funcionar correctamente ahora ✨\n', 'green');

  } catch (error: any) {
    log('\n✗ ERROR AL APLICAR CORRECCIÓN', 'red');
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
