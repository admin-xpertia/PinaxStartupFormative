-- ============================================================================
-- MIGRACIÓN: Fix user table SELECT permissions
-- ============================================================================
-- Fecha: 2025-11-07
-- Descripción: Permite que el backend (usando credenciales root) pueda leer
--              usuarios para validar tokens de autenticación
-- ============================================================================

-- Usar el namespace y database correctos
USE NS StartupFormative;
USE DB Roadmap;

-- Actualizar permisos de la tabla user
-- SELECT FULL permite que credenciales de base de datos (root) puedan leer usuarios
-- Las otras operaciones siguen restringidas a usuarios con rol admin vía scope
-- NOTA: DEFINE PERMISSIONS sobrescribe los permisos anteriores automáticamente
DEFINE PERMISSIONS FOR TABLE user
  FOR select FULL
  FOR create WHERE $auth.rol = 'admin'
  FOR update WHERE id = $auth.id OR $auth.rol = 'admin'
  FOR delete WHERE $auth.rol = 'admin';

-- Verificar los cambios
INFO FOR TABLE user;
