import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Test con USE antes de SIGNIN ===\n');
    
    console.log('1. Conectando...');
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    console.log('   ✅ Conectado\n');
    
    // NO hacer signin como root, solo conectar y usar
    console.log('2. Seleccionando namespace y database...');
    await db.use({
      namespace: 'StartupFormative',
      database: 'Roadmap',
    });
    console.log('   ✅ Namespace y database seleccionados\n');
    
    console.log('3. Intentando SIGNIN con SCOPE...');
    const token = await db.signin({
      SC: 'instructor_scope',
      email: 'instructor@xpertia.com',
      password: 'instructor123!',
    });
    
    console.log('   ✅ ¡SIGNIN exitoso!');
    console.log('   Token recibido:', token ? 'Sí' : 'No');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.close();
  }
}

main();
