-- ============================================================================
-- SEED DATA - USUARIOS DEMO
-- ============================================================================
-- Datos iniciales para desarrollo y testing

-- Usuario Admin Demo
CREATE user:admin SET
  email = 'admin@xpertia.com',
  nombre = 'Administrador Demo',
  password_hash = crypto::argon2::generate('Admin123!'),
  rol = 'admin',
  activo = true,
  preferencias = {},
  created_at = time::now(),
  updated_at = time::now();

-- Usuario Instructor Demo
CREATE user:instructor SET
  email = 'instructor@xpertia.com',
  nombre = 'Instructor Demo',
  password_hash = crypto::argon2::generate('Instructor123!'),
  rol = 'instructor',
  activo = true,
  preferencias = {},
  created_at = time::now(),
  updated_at = time::now();
