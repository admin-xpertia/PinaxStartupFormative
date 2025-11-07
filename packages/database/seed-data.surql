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

-- Usuario Estudiante Demo
CREATE user:estudiante_demo SET
  email = 'estudiante@xpertia.com',
  nombre = 'Estudiante Demo',
  password_hash = crypto::argon2::generate('Estudiante123!'),
  rol = 'estudiante',
  activo = true,
  preferencias = {},
  created_at = time::now(),
  updated_at = time::now();

-- Perfil del Estudiante Demo
CREATE estudiante:demo SET
  user = user:estudiante_demo,
  metadata = {},
  pais = 'España',
  ciudad = 'Madrid',
  nivel_educativo = 'Universitario',
  intereses = ['emprendimiento', 'innovación', 'tecnología'],
  biografia = 'Estudiante demo para testing y desarrollo',
  created_at = time::now(),
  updated_at = time::now();
