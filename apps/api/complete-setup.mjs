#!/usr/bin/env node

import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Setup completo de autenticación ===\n');
    
    console.log('1. Conectando a SurrealDB...');
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    
    console.log('2. Autenticando como admin...');
    await db.signin({ username: 'admin', password: 'xpertia123' });
    
    console.log('3. Seleccionando namespace y database...');
    await db.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    
    console.log('4. Verificando/recreando ACCESS instructor_scope...');
    try {
      await db.query('REMOVE ACCESS instructor_scope ON DATABASE;');
      console.log('   ACCESS anterior removido');
    } catch (e) {
      console.log('   (No existía ACCESS anterior)');
    }
    
    console.log('5. Creando ACCESS instructor_scope...');
    const accessResult = await db.query(`
      DEFINE ACCESS instructor_scope ON DATABASE TYPE RECORD
        SIGNUP (
          CREATE user SET
            email = \$email,
            nombre = \$nombre,
            password_hash = crypto::argon2::generate(\$password),
            rol = 'instructor',
            activo = true,
            preferencias = {}
        )
        SIGNIN (
          SELECT * FROM user
          WHERE email = \$email
          AND rol IN ['instructor', 'admin']
          AND crypto::argon2::compare(password_hash, \$password)
          AND activo = true
        )
        DURATION FOR TOKEN 1h, FOR SESSION 14d;
    `);
    console.log('   ✅ ACCESS creado\n');
    
    console.log('6. Verificando usuarios existentes...');
    const users = await db.query('SELECT id, email, rol FROM user;');
    console.log('   Usuarios:', JSON.stringify(users[0]?.result, null, 2));
    
    if (!users[0]?.result || users[0].result.length === 0) {
      console.log('\n7. Creando usuarios de prueba...');
      await db.query(`
        CREATE user:admin SET
            email = 'admin@xpertia.com',
            nombre = 'Administrador',
            password_hash = crypto::argon2::generate('changeme123!'),
            rol = 'admin',
            activo = true,
            preferencias = {};
      `);
      console.log('   ✅ Admin creado');
      
      await db.query(`
        CREATE user:instructor_demo SET
            email = 'instructor@xpertia.com',
            nombre = 'Instructor Demo',
            password_hash = crypto::argon2::generate('instructor123!'),
            rol = 'instructor',
            activo = true,
            preferencias = {};
      `);
      console.log('   ✅ Instructor creado\n');
    } else {
      console.log('   Los usuarios ya existen\n');
    }
    
    await db.close();
    
    // Probar autenticación
    console.log('8. Probando autenticación con instructor...');
    const db2 = new Surreal();
    await db2.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db2.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    
    const token = await db2.signin({
      AC: 'instructor_scope',
      email: 'instructor@xpertia.com',
      password: 'instructor123!',
    });
    console.log('   ✅ Token obtenido');
    
    console.log('\n9. Intentando leer usuario autenticado con select...');
    const userSelect = await db2.select('user:instructor_demo');
    console.log('   Resultado select:', userSelect ? JSON.stringify(userSelect, null, 2) : 'vacío');
    
    console.log('\n10. Intentando leer con query SELECT * FROM $auth...');
    const authQuery = await db2.query('SELECT * FROM \$auth;');
    console.log('   Resultado $auth:', JSON.stringify(authQuery, null, 2));
    
    console.log('\n11. Intentando RETURN $auth...');
    const returnAuth = await db2.query('RETURN \$auth;');
    console.log('   Resultado RETURN $auth:', JSON.stringify(returnAuth, null, 2));
    
    await db2.close();
    
    console.log('\n✅ ¡Setup completado exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

main();
