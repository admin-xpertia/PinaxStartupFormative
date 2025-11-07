#!/usr/bin/env tsx
/**
 * Script para verificar permisos de la tabla user
 */

import Surreal from 'surrealdb.js';

const SURREAL_URL = 'wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud';
const SURREAL_USER = 'admin';
const SURREAL_PASS = 'xpertia123';
const SURREAL_NS = 'StartupFormative';
const SURREAL_DB = 'Roadmap';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message: string, color?: keyof typeof colors) {
  const colorCode = color ? colors[color] : colors.reset;
  console.log(`${colorCode}${message}${colors.reset}`);
}

async function main() {
  const db = new Surreal();

  try {
    log('📡 Conectando a SurrealDB...', 'cyan');
    await db.connect(SURREAL_URL);
    await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
    await db.use({ namespace: SURREAL_NS, database: SURREAL_DB });
    log('✓ Conectado\n', 'green');

    // Verificar que el usuario instructor existe
    log('🔍 Verificando usuario instructor...', 'cyan');
    const userResult = await db.select('user:instructor');
    console.log('Usuario instructor:', JSON.stringify(userResult, null, 2));

    // Verificar scopes
    log('\n🔍 Verificando scopes de la base de datos...', 'cyan');
    const dbInfo = await db.query('INFO FOR DB;');
    console.log('Scopes disponibles:', JSON.stringify(dbInfo, null, 2));

  } catch (error: any) {
    log('\n✗ ERROR', 'red');
    log(error.message, 'red');
  } finally {
    await db.close();
  }
}

main();
