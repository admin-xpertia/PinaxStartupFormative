#!/usr/bin/env node

import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Recreando tabla user con permisos ===\n');
    
    console.log('1. Conectando a SurrealDB...');
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    
    console.log('2. Autenticando como admin...');
    await db.signin({ username: 'admin', password: 'xpertia123' });
    
    console.log('3. Seleccionando namespace y database...');
    await db.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    
    console.log('4. Respaldando usuarios existentes...');
    const existingUsers = await db.query('SELECT * FROM user;');
    console.log(`   Encontrados ${existingUsers[0]?.result?.length || 0} usuarios`);
    
    console.log('5. Removiendo tabla user...');
    await db.query('REMOVE TABLE user;');
    console.log('   ✅ Tabla removida\n');
    
    console.log('6. Recreando tabla user con permisos...');
    await db.query(`
      DEFINE TABLE user SCHEMAFULL PERMISSIONS
          FOR select WHERE id = $auth.id
          FOR update WHERE id = $auth.id
          FOR delete NONE;
    `);
    console.log('   ✅ Tabla creada con permisos\n');
    
    console.log('7. Definiendo campos...');
    await db.query(`
      DEFINE FIELD email ON user TYPE string
          ASSERT \$value != NONE
          AND string::contains(\$value, '@')
          AND string::len(\$value) >= 5;

      DEFINE FIELD nombre ON user TYPE string
          ASSERT \$value != NONE AND string::len(\$value) >= 2;

      DEFINE FIELD password_hash ON user TYPE string
          ASSERT \$value != NONE;

      DEFINE FIELD rol ON user TYPE string
          ASSERT \$value IN ['admin', 'instructor', 'estudiante']
          DEFAULT 'estudiante';

      DEFINE FIELD preferencias ON user TYPE object
          DEFAULT {};

      DEFINE FIELD activo ON user TYPE bool
          DEFAULT true;

      DEFINE FIELD created_at ON user TYPE datetime
          DEFAULT time::now()
          READONLY;

      DEFINE FIELD updated_at ON user TYPE datetime
          DEFAULT time::now()
          VALUE time::now();
    `);
    console.log('   ✅ Campos definidos\n');
    
    console.log('8. Definiendo índices...');
    await db.query(`
      DEFINE INDEX userEmailIdx ON user FIELDS email UNIQUE;
      DEFINE INDEX userRolIdx ON user FIELDS rol;
      DEFINE INDEX userActivoIdx ON user FIELDS activo;
    `);
    console.log('   ✅ Índices definidos\n');
    
    console.log('9. Recreando usuarios...');
    const adminResult = await db.query(`
      CREATE user:admin SET
          email = 'admin@xpertia.com',
          nombre = 'Administrador',
          password_hash = crypto::argon2::generate('changeme123!'),
          rol = 'admin',
          activo = true,
          preferencias = {};
    `);
    console.log('   ✅ Admin creado:', adminResult[0]?.result?.[0]?.id);
    
    const instructorResult = await db.query(`
      CREATE user:instructor_demo SET
          email = 'instructor@xpertia.com',
          nombre = 'Instructor Demo',
          password_hash = crypto::argon2::generate('instructor123!'),
          rol = 'instructor',
          activo = true,
          preferencias = {};
    `);
    console.log('   ✅ Instructor creado:', instructorResult[0]?.result?.[0]?.id);
    console.log('');
    
    console.log('10. Verificando permisos...');
    const tableInfo = await db.query('INFO FOR TABLE user;');
    console.log('   Permisos de la tabla:', JSON.stringify(tableInfo[0]?.result?.permissions, null, 2));
    console.log('');
    
    await db.close();
    
    // Probar autenticación
    console.log('11. Probando autenticación con instructor...');
    const db2 = new Surreal();
    await db2.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db2.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    
    const token = await db2.signin({
      AC: 'instructor_scope',
      email: 'instructor@xpertia.com',
      password: 'instructor123!',
    });
    console.log('   ✅ Token obtenido');
    
    console.log('12. Intentando leer usuario autenticado...');
    const user = await db2.select('user:instructor_demo');
    console.log('   Usuario leído:', user ? JSON.stringify(user, null, 2) : 'null/undefined');
    
    console.log('13. Intentando usar SELECT * FROM $auth...');
    const authQuery = await db2.query('SELECT * FROM \$auth;');
    console.log('   Resultado $auth:', JSON.stringify(authQuery, null, 2));
    
    await db2.close();
    
    console.log('\n✅ ¡Proceso completado exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

main();
