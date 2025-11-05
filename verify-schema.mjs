import Surreal from 'surrealdb.js';

async function verifySchema() {
  const db = new Surreal();

  try {
    // Conectar a SurrealDB
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');

    // Autenticar
    await db.signin({
      user: 'admin',
      pass: 'xpertia123',
    });

    // Usar el namespace y database
    await db.use({
      namespace: 'StartupFormative',
      database: 'Roadmap',
    });

    console.log('✅ Conectado exitosamente a SurrealDB\n');

    // Verificar tabla componente_contenido
    console.log('📋 Verificando tabla: componente_contenido');
    const infoComponente = await db.query('INFO FOR TABLE componente_contenido;');
    console.log('Información de componente_contenido:');
    console.log(JSON.stringify(infoComponente[0].result, null, 2));
    console.log('\n');

    // Verificar tabla validacion_calidad
    console.log('📋 Verificando tabla: validacion_calidad');
    const infoValidacion = await db.query('INFO FOR TABLE validacion_calidad;');
    console.log('Información de validacion_calidad:');
    console.log(JSON.stringify(infoValidacion[0].result, null, 2));
    console.log('\n');

    // Contar registros en componente_contenido
    const countComponente = await db.query('SELECT count() FROM componente_contenido GROUP ALL;');
    console.log('📊 Total de registros en componente_contenido:', countComponente[0].result[0]?.count || 0);

    // Contar registros en validacion_calidad
    const countValidacion = await db.query('SELECT count() FROM validacion_calidad GROUP ALL;');
    console.log('📊 Total de registros en validacion_calidad:', countValidacion[0].result[0]?.count || 0);

    console.log('\n✅ Verificación completada exitosamente');

  } catch (error) {
    console.error('❌ Error al verificar el esquema:', error);
    throw error;
  } finally {
    await db.close();
  }
}

verifySchema().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
