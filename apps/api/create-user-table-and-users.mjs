#!/usr/bin/env node

import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Creando tabla user y usuarios ===\n');
    
    console.log('1. Conectando...');
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db.signin({ username: 'admin', password: 'xpertia123' });
    await db.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    console.log('   ✅ Conectado\n');
    
    console.log('2. Creando tabla user con permisos...');
    await db.query(`
      DEFINE TABLE IF NOT EXISTS user SCHEMAFULL PERMISSIONS
          FOR select WHERE id = \$auth.id
          FOR update WHERE id = \$auth.id
          FOR delete NONE;
    `);
    console.log('   ✅ Tabla creada\n');
    
    console.log('3. Definiendo campos...');
    await db.query(`
      DEFINE FIELD IF NOT EXISTS email ON user TYPE string
          ASSERT \$value != NONE
          AND string::contains(\$value, '@')
          AND string::len(\$value) >= 5;

      DEFINE FIELD IF NOT EXISTS nombre ON user TYPE string
          ASSERT \$value != NONE AND string::len(\$value) >= 2;

      DEFINE FIELD IF NOT EXISTS password_hash ON user TYPE string
          ASSERT \$value != NONE;

      DEFINE FIELD IF NOT EXISTS rol ON user TYPE string
          ASSERT \$value IN ['admin', 'instructor', 'estudiante']
          DEFAULT 'estudiante';

      DEFINE FIELD IF NOT EXISTS preferencias ON user TYPE object
          DEFAULT {};

      DEFINE FIELD IF NOT EXISTS activo ON user TYPE bool
          DEFAULT true;

      DEFINE FIELD IF NOT EXISTS created_at ON user TYPE datetime
          DEFAULT time::now()
          READONLY;

      DEFINE FIELD IF NOT EXISTS updated_at ON user TYPE datetime
          DEFAULT time::now()
          VALUE time::now();
    `);
    console.log('   ✅ Campos definidos\n');
    
    console.log('4. Definiendo índices...');
    await db.query(`
      DEFINE INDEX IF NOT EXISTS userEmailIdx ON user FIELDS email UNIQUE;
      DEFINE INDEX IF NOT EXISTS userRolIdx ON user FIELDS rol;
      DEFINE INDEX IF NOT EXISTS userActivoIdx ON user FIELDS activo;
    `);
    console.log('   ✅ Índices definidos\n');
    
    console.log('5. Creando usuarios...');
    try {
      await db.query(`
        CREATE user:admin CONTENT {
            email: 'admin@xpertia.com',
            nombre: 'Administrador',
            password_hash: crypto::argon2::generate('changeme123!'),
            rol: 'admin',
            activo: true,
            preferencias: {}
        };
      `);
      console.log('   ✅ Admin creado');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('   ⚠️  Admin ya existe');
      } else {
        throw e;
      }
    }
    
    try {
      await db.query(`
        CREATE user:instructor_demo CONTENT {
            email: 'instructor@xpertia.com',
            nombre: 'Instructor Demo',
            password_hash: crypto::argon2::generate('instructor123!'),
            rol: 'instructor',
            activo: true,
            preferencias: {}
        };
      `);
      console.log('   ✅ Instructor creado\n');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('   ⚠️  Instructor ya existe\n');
      } else {
        throw e;
      }
    }
    
    await db.close();
    
    // Probar autenticación
    console.log('6. Probando autenticación...');
    const db2 = new Surreal();
    await db2.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db2.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    
    const token = await db2.signin({
      AC: 'instructor_scope',
      email: 'instructor@xpertia.com',
      password: 'instructor123!',
    });
    console.log('   ✅ Token obtenido\n');
    
    console.log('7. Leyendo usuario...');
    const user = await db2.select('user:instructor_demo');
    if (user && user.length > 0) {
      const { password_hash, ...userWithoutPassword } = user[0];
      console.log('   ✅ Usuario:', JSON.stringify(userWithoutPassword, null, 2));
    } else {
      console.log('   ❌ Usuario NO encontrado');
    }
    
    await db2.close();
    
    console.log('\n✅ ¡Setup completado exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

main();
