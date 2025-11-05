#!/usr/bin/env node

import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Diagnóstico del estado de la base de datos ===\n');
    
    console.log('1. Conectando como admin...');
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db.signin({ username: 'admin', password: 'xpertia123' });
    await db.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    console.log('   ✅ Conectado\n');
    
    console.log('2. Verificando ACCESS definidos...');
    const dbInfo = await db.query('INFO FOR DB;');
    const accesses = dbInfo[0]?.result?.accesses || dbInfo[0]?.accesses || {};
    console.log('   Accesses:', Object.keys(accesses));
    if (accesses.instructor_scope) {
      console.log('   instructor_scope EXISTE\n');
    } else {
      console.log('   instructor_scope NO EXISTE\n');
    }
    
    console.log('3. Verificando tabla user...');
    const tableInfo = await db.query('INFO FOR TABLE user;');
    console.log('   Tabla user existe:', tableInfo[0]?.result !== undefined);
    console.log('   Permisos:', JSON.stringify(tableInfo[0]?.result?.permissions, null, 2));
    console.log('');
    
    console.log('4. Listando usuarios...');
    const users = await db.query('SELECT id, email, rol, activo FROM user;');
    console.log('   Usuarios encontrados:', users[0]?.result?.length || 0);
    if (users[0]?.result) {
      for (const user of users[0].result) {
        console.log(`   - ${user.email} (${user.rol}) [${user.activo ? 'activo' : 'inactivo'}]`);
      }
    }
    console.log('');
    
    console.log('5. Intentando signin con instructor@xpertia.com...');
    try {
      await db.close();
      const db2 = new Surreal();
      await db2.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
      await db2.use({ namespace: 'StartupFormative', database: 'Roadmap' });
      
      const token = await db2.signin({
        AC: 'instructor_scope',
        email: 'instructor@xpertia.com',
        password: 'instructor123!',
      });
      console.log('   ✅ ÉXITO - Token obtenido\n');
      
      console.log('6. Probando lectura de usuario...');
      const userResult = await db2.select('user:instructor_demo');
      console.log('   Resultado:', userResult.length > 0 ? `Usuario encontrado (${userResult[0].email})` : 'Vacío');
      
      await db2.close();
      
    } catch (error) {
      console.log(`   ❌ FALLO: ${error.message}\n`);
    }
    
    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

main();
