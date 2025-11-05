import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Test de SIGNUP ===\n');
    
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    console.log('✅ Conectado\n');
    
    console.log('Probando SIGNUP con un nuevo usuario...');
    
    try {
      const token = await db.signup({
        NS: 'StartupFormative',
        DB: 'Roadmap',
        SC: 'instructor_scope',
        email: 'test@example.com',
        nombre: 'Usuario de Prueba',
        password: 'password123!',
      });
      
      console.log('✅ SIGNUP exitoso!');
      console.log('Token recibido:', token ? 'Sí' : 'No');
      
      // Ahora intentar hacer SIGNIN con el mismo usuario
      await db.close();
      
      const db2 = new Surreal();
      await db2.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
      
      console.log('\nIntentando SIGNIN con el usuario recién creado...');
      const signinToken = await db2.signin({
        NS: 'StartupFormative',
        DB: 'Roadmap',
        SC: 'instructor_scope',
        email: 'test@example.com',
        password: 'password123!',
      });
      
      console.log('✅ SIGNIN exitoso!');
      console.log('Token recibido:', signinToken ? 'Sí' : 'No');
      
      await db2.close();
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    if (db) await db.close();
  }
}

main();
