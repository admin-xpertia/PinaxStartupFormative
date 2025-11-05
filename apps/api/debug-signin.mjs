import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db.signin({ username: 'admin', password: 'xpertia123' });
    await db.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    
    console.log('=== Debug de SIGNIN ===\n');
    
    // Obtener el usuario
    console.log('1. Usuario completo:');
    const user = await db.query(`SELECT * FROM user WHERE email = 'instructor@xpertia.com';`);
    console.log(JSON.stringify(user, null, 2));
    console.log('');
    
    // Verificar password_hash
    console.log('2. Verificando password_hash:');
    const hashCheck = await db.query(`
      SELECT 
        email,
        password_hash,
        crypto::argon2::compare(password_hash, 'instructor123!') as password_match
      FROM user 
      WHERE email = 'instructor@xpertia.com';
    `);
    console.log(JSON.stringify(hashCheck, null, 2));
    console.log('');
    
    // Simular la query del SIGNIN
    console.log('3. Simulando query del SIGNIN:');
    const signinQuery = await db.query(`
      SELECT * FROM user
      WHERE email = 'instructor@xpertia.com'
      AND rol IN ['instructor', 'admin']
      AND crypto::argon2::compare(password_hash, 'instructor123!')
      AND activo = true;
    `);
    console.log(JSON.stringify(signinQuery, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.close();
  }
}

main();
