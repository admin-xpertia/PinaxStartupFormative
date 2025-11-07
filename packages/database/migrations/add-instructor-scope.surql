-- ============================================================================
-- MIGRACIÓN: Agregar instructor_scope
-- ============================================================================
-- Fecha: 2025-11-07
-- Descripción: Agrega el scope instructor_scope para autenticación de instructores
-- ============================================================================

-- Usar el namespace y database correctos
USE NS StartupFormative;
USE DB Roadmap;

-- Crear el instructor_scope
DEFINE SCOPE instructor_scope SESSION 24h
  SIGNIN (
    SELECT * FROM user
    WHERE email = $email
    AND crypto::argon2::compare(password_hash, $password)
    AND rol = 'instructor'
    AND activo = true
  )
  SIGNUP (
    CREATE user SET
      email = $email,
      nombre = $nombre,
      password_hash = crypto::argon2::generate($password),
      rol = 'instructor',
      activo = true
  );

-- Verificar que el scope se creó correctamente
INFO FOR DB;
