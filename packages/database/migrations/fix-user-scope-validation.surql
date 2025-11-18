-- ============================================================================
-- MIGRACIÓN: Corregir validación de user_scope
-- ============================================================================
-- Fecha: 2025-11-18
-- Descripción: Actualiza el user_scope para validar rol 'estudiante' y estado activo
-- Problema: El login de estudiantes fallaba porque el scope no validaba el rol ni activo
-- ============================================================================

-- Redefinir el user_scope con validación completa
DEFINE SCOPE user_scope SESSION 24h
  SIGNIN (
    SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password_hash, $password) AND rol = 'estudiante' AND activo = true
  )
  SIGNUP (
    CREATE user SET
      email = $email,
      nombre = $nombre,
      password_hash = crypto::argon2::generate($password),
      rol = 'estudiante',
      activo = true
  );

-- Verificar que el scope se actualizó correctamente
INFO FOR DB;
