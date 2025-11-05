import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Recreando ACCESS con sintaxis correcta ===\n');
    
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db.signin({ username: 'admin', password: 'xpertia123' });
    await db.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    
    console.log('1. Removiendo ACCESS anterior...');
    try {
      await db.query('REMOVE ACCESS instructor_scope ON DATABASE;');
      console.log('   ✅ Removido\n');
    } catch (e) {
      console.log('   (No existía)\n');
    }
    
    console.log('2. Creando nuevo ACCESS con sintaxis v1.5...');
    const createAccess = `
      DEFINE ACCESS instructor_scope ON DATABASE TYPE RECORD
        SIGNUP (
          CREATE user SET
            email = $email,
            nombre = $nombre,
            password_hash = crypto::argon2::generate($password),
            rol = 'instructor',
            activo = true,
            preferencias = {},
            created_at = time::now(),
            updated_at = time::now()
        )
        SIGNIN (
          SELECT * FROM user
          WHERE email = $email
          AND rol IN ['instructor', 'admin']
          AND crypto::argon2::compare(password_hash, $password)
          AND activo = true
        )
        DURATION FOR TOKEN 1h, FOR SESSION 14d;
    `;
    
    await db.query(createAccess);
    console.log('   ✅ ACCESS creado\n');
    
    console.log('3. Verificando ACCESS...');
    const info = await db.query('INFO FOR DB;');
    console.log('   Accesses:', Object.keys(info[0].accesses || {}));
    console.log('');
    
    // Cerrar conexión root
    await db.close();
    
    // Probar autenticación
    console.log('4. Probando autenticación...');
    const db2 = new Surreal();
    await db2.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db2.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    
    const token = await db2.signin({
      AC: 'instructor_scope',
      email: 'instructor@xpertia.com',
      password: 'instructor123!',
    });
    
    console.log('   ✅ ¡Autenticación exitosa!');
    console.log('   Token recibido:', token ? 'Sí' : 'No');
    
    await db2.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalle:', error);
  }
}

main();
