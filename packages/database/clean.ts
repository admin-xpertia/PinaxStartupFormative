import Surreal from 'surrealdb.js';

/**
 * Script para limpiar la base de datos de SurrealDB
 * Elimina todos los datos pero mantiene el esquema intacto
 *
 * Uso:
 *   npm run db:clean
 */

async function cleanDatabase() {
  const db = new Surreal();

  try {
    console.log('🔌 Conectando a SurrealDB...');

    await db.connect(process.env.SURREALDB_URL || 'http://localhost:8000/rpc', {
      namespace: process.env.SURREALDB_NAMESPACE || 'xpertia',
      database: process.env.SURREALDB_DATABASE || 'xpertia_dev',
    });

    // Autenticación si es necesaria
    if (process.env.SURREALDB_USER && process.env.SURREALDB_PASS) {
      await db.signin({
        username: process.env.SURREALDB_USER,
        password: process.env.SURREALDB_PASS,
      });
    }

    console.log('✅ Conectado exitosamente');
    console.log('🧹 Limpiando base de datos...\n');

    // Lista de todas las tablas en orden de dependencia
    // (eliminar primero las tablas dependientes)
    const tables = [
      // Analytics y eventos
      'evento_aprendizaje',
      'progreso',
      'snapshot_analytics',

      // Relaciones de cohortes
      'estudiante_cohorte',
      'comunicacion',
      'estudiante',
      'cohorte',

      // Contenido generado
      'version_contenido',
      'contenido',
      'rubrica',
      'prompt_template',

      // Arquitectura del programa
      'componente',
      'nivel',
      'proofpoint',
      'fase',
      'programa',

      // Usuarios
      'instructor',
      'user',
    ];

    let totalRecordsDeleted = 0;

    for (const table of tables) {
      try {
        const result = await db.query(`DELETE ${table};`);

        // Extraer el resultado
        const deleteResult = result[0]?.result;
        const count = Array.isArray(deleteResult) ? deleteResult.length : 0;

        totalRecordsDeleted += count;

        if (count > 0) {
          console.log(`  ✓ ${table.padEnd(25)} - ${count} registros eliminados`);
        } else {
          console.log(`  · ${table.padEnd(25)} - (vacía)`);
        }
      } catch (error) {
        console.log(`  ✗ ${table.padEnd(25)} - Error: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Base de datos limpiada exitosamente`);
    console.log(`📊 Total de registros eliminados: ${totalRecordsDeleted}`);
    console.log('='.repeat(50) + '\n');

    // Verificación final
    console.log('🔍 Verificando estado de las tablas...');
    for (const table of ['user', 'programa', 'cohorte', 'componente']) {
      const result = await db.query(`SELECT count() FROM ${table} GROUP ALL;`);
      const count = result[0]?.result?.[0]?.count || 0;
      console.log(`  ${table}: ${count} registros`);
    }

    console.log('\n✨ La base de datos está lista para pruebas E2E desde cero\n');

  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    process.exit(1);
  } finally {
    await db.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Confirmación de seguridad
if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: No se puede ejecutar db:clean en producción');
  process.exit(1);
}

// Prompt de confirmación en ambiente de staging
if (process.env.NODE_ENV === 'staging' && !process.env.FORCE_CLEAN) {
  console.log('⚠️  ADVERTENCIA: Estás ejecutando este script en STAGING');
  console.log('   Para continuar, ejecuta: FORCE_CLEAN=true npm run db:clean');
  process.exit(0);
}

cleanDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
