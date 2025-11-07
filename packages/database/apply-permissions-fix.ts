#!/usr/bin/env tsx

/**
 * Script para aplicar fix de permisos en tabla user
 *
 * Este script aplica la migración que permite al backend (usando root)
 * leer usuarios para validar tokens de autenticación
 */

import Surreal from 'surrealdb.js';
import * as fs from 'fs';
import * as path from 'path';

const SURREAL_URL = process.env.SURREAL_URL || 'wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud';
const SURREAL_NAMESPACE = process.env.SURREAL_NAMESPACE || 'StartupFormative';
const SURREAL_DATABASE = process.env.SURREAL_DATABASE || 'Roadmap';
const SURREAL_USER = process.env.SURREAL_USER || 'root';
const SURREAL_PASS = process.env.SURREAL_PASS || 'xpertia123';

async function applyPermissionsFix() {
  console.log('🔧 APLICANDO FIX DE PERMISOS - user table');
  console.log('=====================================\n');

  const db = new Surreal();

  try {
    // Conectar a SurrealDB
    console.log(`📡 Conectando a: ${SURREAL_URL}`);
    await db.connect(SURREAL_URL);

    console.log(`🔐 Autenticando como: ${SURREAL_USER}`);
    await db.signin({
      username: SURREAL_USER,
      password: SURREAL_PASS,
    });

    console.log(`📦 Usando: ${SURREAL_NAMESPACE}/${SURREAL_DATABASE}\n`);
    await db.use({
      namespace: SURREAL_NAMESPACE,
      database: SURREAL_DATABASE
    });

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'migrations', 'fix-user-permissions.surql');
    console.log(`📄 Leyendo migración: ${migrationPath}`);
    const migration = fs.readFileSync(migrationPath, 'utf-8');

    // Aplicar la migración
    console.log('⚙️  APLICANDO FIX...\n');

    const result = await db.query(migration);

    console.log('✅ FIX APLICADO EXITOSAMENTE\n');

    // Mostrar información de la tabla user
    console.log('📋 INFORMACIÓN DE LA TABLA USER:');
    console.log('=================================');

    const tableInfo = await db.query('INFO FOR TABLE user;');
    if (tableInfo && tableInfo.length > 0) {
      console.log(JSON.stringify(tableInfo[0], null, 2));
    }

    console.log('\n✅ MIGRACIÓN COMPLETADA');
    console.log('\n📝 Nota: El backend ahora puede leer usuarios usando credenciales root');
    console.log('   para validar tokens de autenticación del guard.\n');

  } catch (error: any) {
    console.error('\n❌ ERROR AL APLICAR FIX:', error.message);

    if (error.message?.includes('already exists')) {
      console.log('\n✓ Los permisos ya fueron actualizados previamente.');
    } else {
      console.error('\nDetalles del error:', error);
      process.exit(1);
    }
  } finally {
    await db.close();
  }
}

// Ejecutar el script
applyPermissionsFix().catch(console.error);
