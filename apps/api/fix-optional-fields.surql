-- Hacer que los campos opcionales en componente permitan NONE
-- Eliminar y redefinir los campos para permitir valores opcionales

REMOVE FIELD descripcion_breve ON componente;
REMOVE FIELD version_contenido_actual ON componente;

-- Redefinir los campos sin restricciones ASSERT, permitiendo NONE
DEFINE FIELD descripcion_breve ON componente FLEXIBLE TYPE option<string>;
DEFINE FIELD version_contenido_actual ON componente FLEXIBLE TYPE option<record<componente_contenido>>;
