import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Creando Usuarios de Prueba ===\n');
    
    console.log('1. Conectando a SurrealDB...');
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    console.log('   ✅ Conectado\n');
    
    console.log('2. Autenticando como root...');
    await db.signin({
      username: 'admin',
      password: 'xpertia123',
    });
    console.log('   ✅ Autenticado\n');
    
    console.log('3. Seleccionando namespace y database...');
    await db.use({
      namespace: 'StartupFormative',
      database: 'Roadmap',
    });
    console.log('   ✅ Seleccionado\n');
    
    console.log('4. Creando usuario admin...');
    await db.query(`
      CREATE user:admin SET
        email = 'admin@xpertia.com',
        nombre = 'Administrador',
        password_hash = crypto::argon2::generate('changeme123!'),
        rol = 'admin',
        activo = true,
        preferencias = {},
        created_at = time::now(),
        updated_at = time::now();
    `);
    console.log('   ✅ Usuario admin creado\n');
    
    console.log('5. Creando usuario instructor...');
    await db.query(`
      CREATE user:instructor_demo SET
        email = 'instructor@xpertia.com',
        nombre = 'Instructor Demo',
        password_hash = crypto::argon2::generate('instructor123!'),
        rol = 'instructor',
        activo = true,
        preferencias = {},
        created_at = time::now(),
        updated_at = time::now();
    `);
    console.log('   ✅ Usuario instructor creado\n');
    
    console.log('6. Verificando usuarios creados...');
    const users = await db.query('SELECT email, rol, activo FROM user;');
    console.log('   Usuarios:', JSON.stringify(users, null, 2));
    console.log('');
    
    console.log('✅ Usuarios de prueba creados exitosamente!');
    console.log('\nCredenciales:');
    console.log('  Admin: admin@xpertia.com / changeme123!');
    console.log('  Instructor: instructor@xpertia.com / instructor123!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 Los usuarios ya existen. Esto es normal si ya se ejecutó este script antes.');
    }
  } finally {
    await db.close();
  }
}

main();
