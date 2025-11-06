-- Agregar campo faltante a la tabla componente
DEFINE FIELD descripcion_breve ON componente TYPE string;
DEFINE FIELD version_contenido_actual ON componente TYPE record<componente_contenido>;
