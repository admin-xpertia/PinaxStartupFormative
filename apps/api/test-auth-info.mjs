import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Test de obtención de info de usuario ===\n');
    
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    
    console.log('1. Haciendo signin...');
    const token = await db.signin({
      AC: 'instructor_scope',
      email: 'instructor@xpertia.com',
      password: 'instructor123!',
    });
    console.log('   ✅ Token recibido:', token ? 'Sí' : 'No');
    console.log('   Token (primeros 50 chars):', token?.substring(0, 50));
    
    console.log('\n2. Intentando SELECT * FROM $auth...');
    try {
      const result = await db.query('SELECT * FROM $auth');
      console.log('   Resultado:', JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('   Error:', e.message);
    }
    
    console.log('\n3. Intentando db.info()...');
    try {
      const info = await db.info();
      console.log('   Info:', JSON.stringify(info, null, 2));
    } catch (e) {
      console.log('   Error:', e.message);
    }
    
    console.log('\n4. Verificando con authenticate + query...');
    await db.close();
    
    const db2 = new Surreal();
    await db2.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db2.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    await db2.authenticate(token);
    
    const authResult = await db2.query('SELECT * FROM $auth');
    console.log('   Resultado después de authenticate:', JSON.stringify(authResult, null, 2));
    
    const info2 = await db2.info();
    console.log('   Info después de authenticate:', JSON.stringify(info2, null, 2));
    
    await db2.close();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

main();
