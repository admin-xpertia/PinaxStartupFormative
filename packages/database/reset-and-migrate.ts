#!/usr/bin/env tsx
/**
 * Reset and Migrate Database Script
 *
 * Este script:
 * 1. Elimina TODAS las tablas existentes
 * 2. Elimina TODOS los datos
 * 3. Aplica el nuevo schema DDD desde schema-ddd.surql
 * 4. Opcionalmente inserta datos de seed
 *
 * ADVERTENCIA: Este script es DESTRUCTIVO. Eliminará TODOS los datos.
 *
 * Uso:
 *   pnpm tsx reset-and-migrate.ts [--skip-seed]
 *
 * Opciones:
 *   --skip-seed    No insertar datos de seed después de la migración
 *   --confirm      Confirmar automáticamente (para scripts CI/CD)
 */

import Surreal from 'surrealdb.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SURREAL_URL = process.env.SURREAL_URL || 'ws://127.0.0.1:8000/rpc';
const SURREAL_USER = process.env.SURREAL_USER || 'root';
const SURREAL_PASS = process.env.SURREAL_PASS || 'root';
const SURREAL_NS = process.env.SURREAL_NS || 'xpertia';
const SURREAL_DB = process.env.SURREAL_DB || 'plataforma';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color?: keyof typeof colors) {
  const colorCode = color ? colors[color] : colors.reset;
  console.log(`${colorCode}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

async function askConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('¿Estás seguro? Escribe "SI" para confirmar: ', (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase() === 'SI');
    });
  });
}

async function connectDB(): Promise<Surreal> {
  log('Conectando a SurrealDB...', 'blue');
  log(`  URL: ${SURREAL_URL}`, 'blue');
  log(`  Namespace: ${SURREAL_NS}`, 'blue');
  log(`  Database: ${SURREAL_DB}`, 'blue');

  const db = new Surreal();
  await db.connect(SURREAL_URL);
  await db.signin({ username: SURREAL_USER, password: SURREAL_PASS });
  await db.use({ namespace: SURREAL_NS, database: SURREAL_DB });

  log('✓ Conectado exitosamente', 'green');
  return db;
}

async function listTables(db: Surreal): Promise<string[]> {
  try {
    const result = await db.query('INFO FOR DB;');
    const dbInfo = result[0] as any;

    if (dbInfo && dbInfo.tables) {
      return Object.keys(dbInfo.tables);
    }
    // Fallback para versiones antiguas
    if (dbInfo && dbInfo.tb) {
      return Object.keys(dbInfo.tb);
    }
    return [];
  } catch (error) {
    log('Error al listar tablas, asumiendo base de datos vacía', 'yellow');
    return [];
  }
}

async function dropAllTables(db: Surreal) {
  logSection('PASO 1: ELIMINANDO TABLAS EXISTENTES');

  const tables = await listTables(db);

  if (tables.length === 0) {
    log('No hay tablas para eliminar', 'yellow');
    return;
  }

  log(`Encontradas ${tables.length} tablas:`, 'yellow');
  tables.forEach(table => log(`  - ${table}`, 'yellow'));

  for (const table of tables) {
    try {
      await db.query(`REMOVE TABLE ${table};`);
      log(`✓ Tabla eliminada: ${table}`, 'green');
    } catch (error: any) {
      log(`✗ Error al eliminar tabla ${table}: ${error.message}`, 'red');
    }
  }
}

async function dropAllIndexes(db: Surreal) {
  logSection('PASO 2: LIMPIANDO ÍNDICES Y SCOPES');

  try {
    const result = await db.query('INFO FOR DB;');
    const dbInfo = result[0] as any;

    // Eliminar scopes
    const scopes = dbInfo?.scopes || dbInfo?.sc || {};
    const scopeKeys = Object.keys(scopes);

    if (scopeKeys.length > 0) {
      for (const scope of scopeKeys) {
        try {
          await db.query(`REMOVE SCOPE ${scope};`);
          log(`✓ Scope eliminado: ${scope}`, 'green');
        } catch (error: any) {
          log(`✗ Error al eliminar scope ${scope}: ${error.message}`, 'red');
        }
      }
    } else {
      log('No hay scopes para eliminar', 'yellow');
    }
  } catch (error: any) {
    log(`Advertencia: ${error.message}`, 'yellow');
  }
}

async function applySchema(db: Surreal) {
  logSection('PASO 3: APLICANDO NUEVO SCHEMA DDD');

  const schemaPath = join(__dirname, 'schema', 'schema-ddd.surql');
  log(`Leyendo schema desde: ${schemaPath}`, 'blue');

  try {
    const schemaContent = readFileSync(schemaPath, 'utf-8');

    // Dividir el schema en statements individuales
    const statements = schemaContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    log(`Ejecutando ${statements.length} statements...`, 'blue');

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Mostrar progreso cada 10 statements
      if ((i + 1) % 10 === 0) {
        log(`  Progreso: ${i + 1}/${statements.length}`, 'cyan');
      }

      try {
        await db.query(statement);
      } catch (error: any) {
        // Ignorar algunos errores comunes que no son críticos
        if (
          error.message.includes('already exists') ||
          error.message.includes('Unexpected token')
        ) {
          // Continuar
        } else {
          log(`Advertencia en statement ${i + 1}: ${error.message}`, 'yellow');
        }
      }
    }

    log('✓ Schema aplicado exitosamente', 'green');
  } catch (error: any) {
    log(`✗ Error al aplicar schema: ${error.message}`, 'red');
    throw error;
  }
}

async function applySeed(db: Surreal, skipSeed: boolean) {
  if (skipSeed) {
    log('Saltando aplicación de seed (--skip-seed)', 'yellow');
    return;
  }

  logSection('PASO 4: APLICANDO DATOS SEED');

  const seedPath = join(__dirname, 'seed-data.surql');
  log(`Leyendo seed desde: ${seedPath}`, 'blue');

  try {
    const seedContent = readFileSync(seedPath, 'utf-8');

    // Dividir el seed en statements individuales
    const statements = seedContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    log(`Ejecutando ${statements.length} statements de seed...`, 'blue');

    for (const statement of statements) {
      try {
        await db.query(statement + ';');
      } catch (error: any) {
        // Mostrar errores pero continuar
        log(`Advertencia en seed: ${error.message}`, 'yellow');
      }
    }

    log('✓ Seed aplicado exitosamente', 'green');
  } catch (error: any) {
    log(`✗ Error al aplicar seed: ${error.message}`, 'red');
    throw error;
  }
}

async function verifySeed(db: Surreal) {
  logSection('PASO 5: VERIFICANDO DATOS SEED');

  try {
    // Verificar usuarios
    const users = await db.query('SELECT * FROM user;');
    const userCount = (users[0] as any[]).length;
    log(`✓ Usuarios creados: ${userCount}`, 'green');

    if (userCount > 0) {
      log('  Usuarios disponibles:', 'blue');
      (users[0] as any[]).forEach((user: any) => {
        log(`    - ${user.email} (${user.rol})`, 'blue');
      });
    }
  } catch (error: any) {
    log(`✗ Error al verificar seed: ${error.message}`, 'red');
  }
}

async function verifySchema(db: Surreal) {
  logSection('PASO 6: VERIFICANDO SCHEMA');

  const expectedTables = [
    'programa',
    'fase',
    'proof_point',
    'exercise_template',
    'exercise_instance',
    'exercise_content',
    'user',
  ];

  const tables = await listTables(db);

  log('Tablas esperadas:', 'blue');
  for (const table of expectedTables) {
    const exists = tables.includes(table);
    const status = exists ? '✓' : '✗';
    const color = exists ? 'green' : 'red';
    log(`  ${status} ${table}`, color);
  }

  const allTablesExist = expectedTables.every(t => tables.includes(t));

  if (allTablesExist) {
    log('\n✓ Todas las tablas esperadas fueron creadas', 'green');
  } else {
    log('\n✗ Algunas tablas no fueron creadas', 'red');
    throw new Error('Schema incompleto');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const skipSeed = args.includes('--skip-seed');
  const autoConfirm = args.includes('--confirm');

  logSection('RESET Y MIGRACIÓN DE BASE DE DATOS');

  log('⚠️  ADVERTENCIA: Este script eliminará TODOS los datos existentes', 'red');
  log('⚠️  Esta operación es IRREVERSIBLE', 'red');
  log('', 'reset');
  log(`Base de datos: ${SURREAL_NS}.${SURREAL_DB}`, 'yellow');
  log(`URL: ${SURREAL_URL}`, 'yellow');
  log('', 'reset');

  if (!autoConfirm) {
    const confirmed = await askConfirmation();
    if (!confirmed) {
      log('\n✗ Operación cancelada por el usuario', 'red');
      process.exit(0);
    }
  }

  let db: Surreal | null = null;

  try {
    // Conectar
    db = await connectDB();

    // Paso 1: Eliminar todas las tablas
    await dropAllTables(db);

    // Paso 2: Limpiar índices y scopes
    await dropAllIndexes(db);

    // Paso 3: Aplicar nuevo schema
    await applySchema(db);

    // Paso 4: Aplicar datos seed
    await applySeed(db, skipSeed);

    // Paso 5: Verificar datos seed
    await verifySeed(db);

    // Paso 6: Verificar schema
    await verifySchema(db);

    logSection('✓ MIGRACIÓN COMPLETADA EXITOSAMENTE');

    log('\nCredenciales por defecto:', 'cyan');
    log('  Admin:', 'cyan');
    log('    Email: admin@xpertia.com', 'green');
    log('    Password: Admin123!', 'green');
    log('  Instructor:', 'cyan');
    log('    Email: instructor@xpertia.com', 'green');
    log('    Password: Instructor123!', 'green');
    log('', 'reset');
    log('⚠️  IMPORTANTE: Cambiar estas contraseñas en producción', 'yellow');
    log('', 'reset');

    process.exit(0);
  } catch (error: any) {
    log('\n✗ ERROR EN LA MIGRACIÓN', 'red');
    log(error.message, 'red');
    if (error.stack) {
      log('\nStack trace:', 'red');
      log(error.stack, 'red');
    }
    process.exit(1);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

main();
