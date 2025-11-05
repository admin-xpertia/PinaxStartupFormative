import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Aplicando permisos a la tabla user ===\n');
    
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db.signin({ username: 'admin', password: 'xpertia123' });
    await db.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    
    console.log('Definiendo permisos en tabla user...');
    await db.query(`
      DEFINE TABLE user OVERWRITE PERMISSIONS
        FOR select WHERE id = $auth.id
        FOR update WHERE id = $auth.id
        FOR delete NONE;
    `);
    
    console.log('✅ Permisos aplicados\n');
    
    // Probar con autenticación
    console.log('Probando acceso con usuario autenticado...');
    await db.close();
    
    const db2 = new Surreal();
    await db2.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db2.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    
    const token = await db2.signin({
      AC: 'instructor_scope',
      email: 'instructor@xpertia.com',
      password: 'instructor123!',
    });
    
    console.log('Token obtenido, probando select...');
    const user = await db2.select('user:instructor_demo');
    console.log('Usuario obtenido:', JSON.stringify(user, null, 2));
    
    await db2.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

main();
