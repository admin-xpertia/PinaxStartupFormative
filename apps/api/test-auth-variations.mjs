import Surreal from 'surrealdb.js';

async function testVariation(name, credentials) {
  const db = new Surreal();
  try {
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    console.log(`\n${name}:`);
    console.log('  Credentials:', JSON.stringify(credentials, null, 2));
    const token = await db.signin(credentials);
    console.log('  ✅ SUCCESS! Token recibido');
    await db.close();
    return true;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}`);
    await db.close();
    return false;
  }
}

async function main() {
  console.log('=== Probando diferentes variaciones de credenciales ===');
  
  const variations = [
    {
      name: 'Variación 1: NS/DB/AC',
      creds: {
        NS: 'StartupFormative',
        DB: 'Roadmap',
        AC: 'instructor_scope',
        email: 'instructor@xpertia.com',
        password: 'instructor123!',
      }
    },
    {
      name: 'Variación 2: NS/DB/SC',
      creds: {
        NS: 'StartupFormative',
        DB: 'Roadmap',
        SC: 'instructor_scope',
        email: 'instructor@xpertia.com',
        password: 'instructor123!',
      }
    },
    {
      name: 'Variación 3: namespace/database/access',
      creds: {
        namespace: 'StartupFormative',
        database: 'Roadmap',
        access: 'instructor_scope',
        email: 'instructor@xpertia.com',
        password: 'instructor123!',
      }
    },
    {
      name: 'Variación 4: namespace/database/scope',
      creds: {
        namespace: 'StartupFormative',
        database: 'Roadmap',
        scope: 'instructor_scope',
        email: 'instructor@xpertia.com',
        password: 'instructor123!',
      }
    },
  ];
  
  for (const variation of variations) {
    const success = await testVariation(variation.name, variation.creds);
    if (success) {
      console.log('\n✅ ¡Encontramos la variación correcta!');
      break;
    }
  }
}

main();
