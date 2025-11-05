#!/usr/bin/env node

import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Eliminando usuarios huérfanos y recreándolos ===\n');
    
    console.log('1. Conectando...');
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db.signin({ username: 'admin', password: 'xpertia123' });
    await db.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    console.log('   ✅ Conectado\n');
    
    console.log('2. Eliminando registros huérfanos...');
    try {
      await db.query('DELETE user:admin;');
      console.log('   ✅ user:admin eliminado');
    } catch (e) {
      console.log('   ⚠️  user:admin no existía:', e.message);
    }
    
    try {
      await db.query('DELETE user:instructor_demo;');
      console.log('   ✅ user:instructor_demo eliminado\n');
    } catch (e) {
      console.log('   ⚠️  user:instructor_demo no existía:', e.message);
    }
    
    console.log('3. Creando usuarios frescos...');
    const admin = await db.query(`
      CREATE user:admin CONTENT {
          email: 'admin@xpertia.com',
          nombre: 'Administrador',
          password_hash: crypto::argon2::generate('changeme123!'),
          rol: 'admin',
          activo: true,
          preferencias: {}
      };
    `);
    console.log('   ✅ Admin creado:', JSON.stringify(admin[0]?.result, null, 2));
    
    const instructor = await db.query(`
      CREATE user:instructor_demo CONTENT {
          email: 'instructor@xpertia.com',
          nombre: 'Instructor Demo',
          password_hash: crypto::argon2::generate('instructor123!'),
          rol: 'instructor',
          activo: true,
          preferencias: {}
      };
    `);
    console.log('   ✅ Instructor creado:', JSON.stringify(instructor[0]?.result, null, 2));
    console.log('');
    
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
    console.log('   ✅ Token obtenido\n');
    
    console.log('5. Leyendo usuario...');
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
