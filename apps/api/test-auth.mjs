import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Test de Autenticación ===\n');
    
    console.log('1. Conectando a SurrealDB...');
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    console.log('   ✅ Conectado\n');
    
    console.log('2. Autenticando como root...');
    await db.signin({
      username: 'admin',
      password: 'xpertia123',
    });
    console.log('   ✅ Autenticado como root\n');
    
    console.log('3. Seleccionando namespace y database...');
    await db.use({
      namespace: 'StartupFormative',
      database: 'Roadmap',
    });
    console.log('   ✅ Namespace y database seleccionados\n');
    
    console.log('4. Verificando usuarios existentes...');
    const users = await db.query('SELECT email, rol, activo FROM user;');
    console.log('   Usuarios encontrados:', JSON.stringify(users, null, 2));
    console.log('');
    
    console.log('5. Verificando SCOPE instructor_scope...');
    const scopes = await db.query('INFO FOR DB;');
    console.log('   Info de la DB:', JSON.stringify(scopes, null, 2));
    console.log('');
    
    // Cerrar conexión root
    await db.close();
    
    // Nueva conexión para probar autenticación con SCOPE
    console.log('6. Probando autenticación con instructor_scope...');
    const db2 = new Surreal();
    await db2.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    
    console.log('   Intentando signin con instructor@xpertia.com...');
    try {
      const token = await db2.signin({
        NS: 'StartupFormative',
        DB: 'Roadmap',
        SC: 'instructor_scope',
        email: 'instructor@xpertia.com',
        password: 'instructor123!',
      });
      console.log('   ✅ ¡Autenticación exitosa!');
      console.log('   Token recibido:', token ? 'Sí' : 'No');
    } catch (error) {
      console.log('   ❌ Error en autenticación:', error.message);
    }
    
    await db2.close();
    
  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    console.error('Stack:', error.stack);
  }
}

main();
