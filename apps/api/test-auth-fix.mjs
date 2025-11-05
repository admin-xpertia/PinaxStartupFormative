import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Test de Autenticación (FIXED) ===\n');
    
    console.log('Conectando...');
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    
    console.log('Probando autenticación con ACCESS instructor_scope...\n');
    
    // Probar con AC en lugar de SC
    console.log('Intento 1: Usando AC (ACCESS)');
    try {
      const token = await db.signin({
        NS: 'StartupFormative',
        DB: 'Roadmap',
        AC: 'instructor_scope',
        email: 'instructor@xpertia.com',
        password: 'instructor123!',
      });
      console.log('✅ ¡Autenticación exitosa con AC!');
      console.log('Token:', token ? 'Recibido' : 'No recibido');
      return;
    } catch (error) {
      console.log('❌ Falló con AC:', error.message);
    }
    
    // Si falla, probar con SC (versión antigua)
    console.log('\nIntento 2: Usando SC (SCOPE - versión antigua)');
    try {
      const token = await db.signin({
        NS: 'StartupFormative',
        DB: 'Roadmap',
        SC: 'instructor_scope',
        email: 'instructor@xpertia.com',
        password: 'instructor123!',
      });
      console.log('✅ ¡Autenticación exitosa con SC!');
      console.log('Token:', token ? 'Recibido' : 'No recibido');
    } catch (error) {
      console.log('❌ Falló con SC:', error.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error general:', error.message);
  } finally {
    await db.close();
  }
}

main();
