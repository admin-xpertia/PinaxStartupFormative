-- Actualizar schema de la tabla programa
-- Agregar campos opcionales del editor y nuevos estados

-- Actualizar campo estado para incluir nuevos valores
DEFINE FIELD IF NOT EXISTS estado ON programa TYPE string
    ASSERT $value IN ['draft', 'borrador', 'revision', 'publicado', 'archivado']
    DEFAULT 'draft';

-- Campos opcionales del editor
DEFINE FIELD IF NOT EXISTS categoria ON programa TYPE option<string>;

DEFINE FIELD IF NOT EXISTS nivel_dificultad ON programa TYPE option<string>
    ASSERT $value = NONE OR $value IN ['principiante', 'intermedio', 'avanzado'];

DEFINE FIELD IF NOT EXISTS imagen_portada_url ON programa TYPE option<string>;

DEFINE FIELD IF NOT EXISTS objetivos_aprendizaje ON programa TYPE option<array<string>>;

DEFINE FIELD IF NOT EXISTS prerequisitos ON programa TYPE option<array<string>>;

DEFINE FIELD IF NOT EXISTS audiencia_objetivo ON programa TYPE option<string>;

DEFINE FIELD IF NOT EXISTS tags ON programa TYPE option<array<string>>;

DEFINE FIELD IF NOT EXISTS visible ON programa TYPE option<bool> DEFAULT true;
