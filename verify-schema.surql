-- Script para verificar que las tablas componente_contenido y validacion_calidad existen
-- y tienen la estructura correcta

-- Verificar tabla componente_contenido
INFO FOR TABLE componente_contenido;

-- Verificar tabla validacion_calidad
INFO FOR TABLE validacion_calidad;

-- Listar todas las tablas
SELECT * FROM information_schema.tables WHERE table_schema = 'plataforma';
