#!/usr/bin/env tsx
/**
 * Script para verificar la configuración de autenticación
 *
 * Uso:
 *   pnpm tsx verify-setup.ts
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
  blue: '\x1b[34m',
};

function log(message: string, color?: keyof typeof colors) {
  const colorCode = color ? colors[color] : colors.reset;
  console.log(`${colorCode}${message}${colors.reset}`);
}

async function main() {
  log('\n' + '='.repeat(80), 'cyan');
  log('VERIFICACIÓN DE CONFIGURACIÓN DE AUTENTICACIÓN', 'cyan');
  log('='.repeat(80) + '\n', 'cyan');

  const db = new Surreal();

  try {
    // Conectar como admin
    log('📡 Conectando a SurrealDB Cloud como admin...', 'cyan');
    await db.connect(SURREAL_URL);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: SURREAL_NS, database: SURREAL_DB });
    log('✓ Conectado exitosamente\n', 'green');

    // 1. Verificar que instructor_scope existe
    log('1️⃣  Verificando instructor_scope...', 'blue');
    const infoResult = await db.query('INFO FOR DB;');
    const dbInfo = infoResult[0] as any;

    const hasInstructorScope = dbInfo?.scopes?.instructor_scope || dbInfo?.sc?.instructor_scope;

    if (hasInstructorScope) {
      log('   ✓ instructor_scope existe\n', 'green');
    } else {
      log('   ✗ instructor_scope NO existe', 'red');
      log('   Necesitas aplicar la migración primero\n', 'red');
      process.exit(1);
    }

    // 2. Verificar que el usuario instructor existe
    log('2️⃣  Verificando usuario instructor...', 'blue');
    const userResult = await db.query<any[]>("SELECT * FROM user WHERE email = 'instructor@xpertia.com';");
    const users = userResult[0] || [];

    if (users.length > 0) {
      const user = users[0];
      log(`   ✓ Usuario encontrado: ${user.email}`, 'green');
      log(`   • ID: ${user.id}`, 'green');
      log(`   • Nombre: ${user.nombre}`, 'green');
      log(`   • Rol: ${user.rol}`, 'green');
      log(`   • Activo: ${user.activo}\n`, 'green');

      // Verificar que es instructor y está activo
      if (user.rol !== 'instructor') {
        log('   ⚠️  ADVERTENCIA: El usuario no tiene rol "instructor"', 'yellow');
        log(`   Rol actual: ${user.rol}\n`, 'yellow');
      }

      if (!user.activo) {
        log('   ⚠️  ADVERTENCIA: El usuario no está activo', 'yellow');
        log('   Necesitas activarlo para que pueda iniciar sesión\n', 'yellow');
      }
    } else {
      log('   ✗ Usuario instructor@xpertia.com NO encontrado', 'red');
      log('   Ejecuta el seed o crea el usuario manualmente\n', 'red');
      process.exit(1);
    }

    // 3. Probar autenticación con instructor_scope
    log('3️⃣  Probando autenticación con instructor_scope...', 'blue');

    try {
      // Crear una nueva conexión para probar el signin
      const testDb = new Surreal();
      await testDb.connect(SURREAL_URL);

      const token = await testDb.signin({
        namespace: SURREAL_NS,
        database: SURREAL_DB,
        scope: 'instructor_scope',
        email: 'instructor@xpertia.com',
        password: 'Instructor123!',
      });

      if (token) {
        log('   ✓ Autenticación exitosa!', 'green');
        log(`   • Token generado correctamente\n`, 'green');

        // Intentar obtener información del usuario autenticado
        const authInfo = await testDb.query('SELECT * FROM $auth;');
        const authData = authInfo[0] as any;

        if (authData && authData.length > 0) {
          log('   ✓ Información de usuario recuperada:', 'green');
          log(`   ${JSON.stringify(authData[0], null, 2)}\n`, 'green');
        }
      }

      await testDb.close();
    } catch (authError: any) {
      log('   ✗ Error en autenticación:', 'red');
      log(`   ${authError.message}\n`, 'red');

      if (authError.message.includes('No record')) {
        log('   💡 Posibles causas:', 'yellow');
        log('   1. La contraseña es incorrecta', 'yellow');
        log('   2. El usuario no tiene rol=instructor', 'yellow');
        log('   3. El usuario no está activo (activo=false)\n', 'yellow');
      }

      process.exit(1);
    }

    // 4. Verificar configuración del backend
    log('4️⃣  Configuración recomendada para apps/api/.env:', 'blue');
    log('', 'reset');
    log('   SURREAL_URL=wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud', 'cyan');
    log('   SURREAL_NAMESPACE=StartupFormative', 'cyan');
    log('   SURREAL_DATABASE=Roadmap', 'cyan');
    log('   SURREAL_USER=admin', 'cyan');
    log('   SURREAL_PASS=xpertia123\n', 'cyan');

    // Resumen final
    log('='.repeat(80), 'cyan');
    log('✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE', 'green');
    log('='.repeat(80) + '\n', 'cyan');

    log('📝 Próximos pasos:', 'cyan');
    log('1. Verifica que tu archivo apps/api/.env tiene la configuración correcta (arriba)', 'cyan');
    log('2. Reinicia el backend: cd apps/api && pnpm dev', 'cyan');
    log('3. Intenta hacer login desde el frontend', 'cyan');
    log('4. El error "Usuario no encontrado" debería estar resuelto\n', 'cyan');

    log('🎉 Todo está configurado correctamente!', 'green');
    log('', 'reset');

  } catch (error: any) {
    log('\n✗ ERROR EN VERIFICACIÓN', 'red');
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
