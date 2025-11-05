import Surreal from 'surrealdb.js';

const db = new Surreal();

async function main() {
  try {
    console.log('Conectando a SurrealDB...');
    await db.connect('wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud');
    
    console.log('Autenticando...');
    await db.signin({
      username: 'admin',
      password: 'xpertia123',
    });
    
    console.log('Seleccionando namespace y database...');
    await db.use({
      namespace: 'StartupFormative',
      database: 'Roadmap',
    });
    
    console.log('Eliminando SCOPE anterior si existe...');
    try {
      await db.query('REMOVE SCOPE instructor_scope;');
      console.log('  SCOPE anterior eliminado');
    } catch (e) {
      console.log('  No había SCOPE anterior (esto es normal)');
    }
    
    console.log('Creando nuevo SCOPE instructor_scope...');
    const scopeQuery = `
      DEFINE SCOPE instructor_scope
        SESSION 14d
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
        );
    `;
    
    await db.query(scopeQuery);
    console.log('✅ SCOPE instructor_scope aplicado correctamente');
    
    // También crear el scope de estudiantes
    console.log('\nEliminando SCOPE estudiante_scope anterior si existe...');
    try {
      await db.query('REMOVE SCOPE estudiante_scope;');
      console.log('  SCOPE anterior eliminado');
    } catch (e) {
      console.log('  No había SCOPE anterior (esto es normal)');
    }
    
    console.log('Creando nuevo SCOPE estudiante_scope...');
    const estudianteScopeQuery = `
      DEFINE SCOPE estudiante_scope
        SESSION 30d
        SIGNUP (
          CREATE user SET
            email = $email,
            nombre = $nombre,
            password_hash = crypto::argon2::generate($password),
            rol = 'estudiante',
            activo = true,
            preferencias = {},
            created_at = time::now(),
            updated_at = time::now()
        )
        SIGNIN (
          SELECT * FROM user
          WHERE email = $email
          AND rol = 'estudiante'
          AND crypto::argon2::compare(password_hash, $password)
          AND activo = true
        );
    `;
    
    await db.query(estudianteScopeQuery);
    console.log('✅ SCOPE estudiante_scope aplicado correctamente');
    
    console.log('\n✅ Todos los SCOPEs han sido aplicados correctamente');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
