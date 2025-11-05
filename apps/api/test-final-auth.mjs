#!/usr/bin/env node

import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('=== Test final de autenticación ===\n');
    
    console.log('1. Conectando y probando autenticación...');
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    await db.use({ namespace: 'StartupFormative', database: 'Roadmap' });
    
    const token = await db.signin({
      AC: 'instructor_scope',
      email: 'instructor@xpertia.com',
      password: 'instructor123!',
    });
    console.log('   ✅ Token obtenido\n');
    
    console.log('2. Intentando leer usuario con select...');
    const userSelect = await db.select('user:instructor_demo');
    console.log('   Resultado select:', userSelect.length > 0 ? 'Usuario encontrado' : 'Vacío');
    if (userSelect.length > 0) {
      const { password_hash, ...userWithoutPassword } = userSelect[0];
      console.log('   Usuario:', JSON.stringify(userWithoutPassword, null, 2));
    }
    
    console.log('\n3. Intentando RETURN \$auth...');
    const returnAuth = await db.query('RETURN \$auth;');
    console.log('   Resultado:', JSON.stringify(returnAuth, null, 2));
    
    console.log('\n4. Intentando SELECT * FROM \$auth...');
    const selectAuth = await db.query('SELECT * FROM \$auth;');
    console.log('   Resultado:', JSON.stringify(selectAuth, null, 2));
    
    console.log('\n5. Decodificando JWT para verificar payload...');
    const parts = token.split('.');
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    const decoded = JSON.parse(payload);
    console.log('   ID en JWT:', decoded.ID);
    console.log('   AC en JWT:', decoded.AC);
    
    await db.close();
    
    console.log('\n✅ ¡Test completado!');
    console.log('\nResumen:');
    console.log('- Autenticación: ✅ Exitosa');
    console.log('- Token válido: ✅ Sí');
    console.log('- Lectura de usuario:', userSelect.length > 0 ? '✅ Exitosa' : '❌ Fallo');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

main();
