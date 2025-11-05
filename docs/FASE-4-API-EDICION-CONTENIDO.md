# Fase 4: API de Edición de Contenido y Rúbricas

## Objetivo

Conectar las interfaces de edición (lesson-editor, etc.) a la API, implementar la lógica de versionamiento para proteger el contenido publicado, construir el sistema de Rúbricas (backend y frontend) y conectar la biblioteca de plantillas de prompts.

## Implementación Completada

### 1. Esquema de Base de Datos

#### Ubicación
- `packages/database/schema/contenido.surql` - Tabla `rubrica_evaluacion`
- `packages/database/schema/versiones.surql` - Tabla `version_contenido`
- `packages/database/schema/generacion.surql` - Tabla `prompt_template`

#### Tablas Implementadas

**rubrica_evaluacion**
- `componente`: Record link al componente
- `dimensiones`: Array de dimensiones con descriptores
- `pesos_validados`: Boolean
- `created_at`, `updated_at`: Timestamps

**version_contenido**
- `componente`: Record link al componente
- `numero_version`: Número secuencial de versión
- `contenido_snapshot`: Snapshot completo del contenido
- `cambios_descripcion`: Descripción del cambio
- `tipo_cambio`: 'mayor' | 'menor' | 'patch' | 'revision'
- `creado_por`: Record link al usuario
- `checksum`: Hash MD5 del snapshot
- `tags`: Array de etiquetas
- `created_at`: Timestamp

**prompt_template**
- `nombre`: Nombre de la plantilla
- `descripcion`: Descripción
- `tipo_componente`: 'leccion' | 'cuaderno' | 'simulacion' | 'herramienta'
- `prompt_template`: Texto del prompt con variables `{{ variable }}`
- `config_default`: Configuración por defecto (modelo, temperatura, etc.)
- `autor`: Nombre del autor
- `es_oficial`: Boolean - indica si es plantilla oficial de Xpertia
- `creador`: Record link al usuario creador
- `created_at`: Timestamp

### 2. Servicios Backend

#### ContenidoEdicionService
**Ubicación**: `apps/api/src/domains/contenido/contenido-edicion.service.ts`

**Métodos principales:**

- `editarContenido(dto, userId)`: Edita el contenido de un componente
  - Si el contenido está en 'draft', se sobrescribe
  - Si el contenido está 'publicado', se crea un snapshot y un nuevo registro 'draft'

- `publicarContenido(dto, userId)`: Cambia el estado de 'draft' a 'publicado'
  - Una vez publicado, futuras ediciones crean automáticamente versiones

- `restaurarVersion(dto, userId)`: Restaura una versión anterior
  - Crea un nuevo contenido basado en el snapshot de la versión
  - Registra el rollback en `rollback_historia`

- `obtenerHistorialVersiones(componenteId)`: Lista todas las versiones de un componente

- `compararVersiones(versionAnteriorId, versionNuevaId, userId)`: Compara dos versiones
  - Calcula diferencias entre snapshots
  - Guarda la comparación en `comparacion_version`

#### RubricaService
**Ubicación**: `apps/api/src/domains/contenido/rubrica.service.ts`

**Métodos principales:**

- `crearRubrica(dto)`: Crea una rúbrica para un componente
  - Valida que el componente existe
  - Valida que los pesos suman 100 (si `pesosValidados = true`)
  - Valida que los descriptores tienen puntos válidos (0-100)

- `obtenerRubrica(componenteId)`: Obtiene la rúbrica de un componente

- `actualizarRubrica(rubricaId, dto)`: Actualiza una rúbrica existente

- `eliminarRubrica(rubricaId)`: Elimina una rúbrica

- `validarPesos(dto)`: Valida que los pesos suman 100
  - Actualiza el flag `pesos_validados`

- `evaluarConRubrica(componenteId, evaluacion)`: Evalúa un entregable usando la rúbrica
  - Recibe un objeto con el nivel seleccionado para cada dimensión
  - Calcula el puntaje total ponderado
  - Retorna el desglose por dimensión

#### PromptTemplateService
**Ubicación**: `apps/api/src/domains/generacion/prompt-template.service.ts`

**Métodos principales:**

- `crearPlantilla(dto, userId)`: Crea una nueva plantilla de prompt
  - Valida que las variables tengan la sintaxis correcta `{{ variable }}`

- `buscarPlantillas(filtros)`: Busca plantillas con filtros opcionales
  - Filtra por `tipoComponente` y/o `esOficial`

- `obtenerPlantilla(plantillaId)`: Obtiene una plantilla específica

- `actualizarPlantilla(plantillaId, dto, userId)`: Actualiza una plantilla
  - Solo el creador o admin puede actualizar
  - Las plantillas oficiales solo pueden ser actualizadas por admins

- `eliminarPlantilla(plantillaId, userId)`: Elimina una plantilla
  - Las plantillas oficiales no pueden ser eliminadas

- `renderizarPlantilla(plantillaId, variables)`: Renderiza una plantilla
  - Reemplaza las variables `{{ variable }}` con valores reales
  - Advierte si quedan variables sin reemplazar

- `clonarPlantilla(plantillaId, userId, nuevoNombre)`: Clona una plantilla
  - Crea una copia que el usuario puede modificar

### 3. DTOs (Data Transfer Objects)

#### Edición de Contenido
**Ubicación**: `apps/api/src/domains/contenido/dto/editar-contenido.dto.ts`

- `EditarContenidoDto`: Para editar contenido
- `PublicarContenidoDto`: Para publicar contenido
- `RestaurarVersionDto`: Para restaurar versiones

#### Rúbricas
**Ubicación**: `apps/api/src/domains/contenido/dto/rubrica.dto.ts`

- `DescriptorDto`: Descriptor de un nivel de logro
- `DimensionDto`: Dimensión de evaluación
- `CrearRubricaDto`: Para crear rúbricas
- `ValidarPesosDto`: Para validar pesos

#### Plantillas de Prompts
**Ubicación**: `apps/api/src/domains/generacion/dto/prompt-template.dto.ts`

- `CrearPromptTemplateDto`: Para crear plantillas
- `ActualizarPromptTemplateDto`: Para actualizar plantillas
- `BuscarPromptTemplatesDto`: Para buscar plantillas

### 4. Controladores REST

#### ContenidoController
**Ubicación**: `apps/api/src/domains/contenido/contenido.controller.ts`

**Endpoints de Edición:**
- `POST /contenido/editar` - Edita contenido
- `POST /contenido/publicar` - Publica contenido
- `POST /contenido/restaurar` - Restaura versión
- `GET /contenido/historial/:componenteId` - Obtiene historial
- `GET /contenido/comparar?versionAnterior=X&versionNueva=Y` - Compara versiones

**Endpoints de Rúbricas:**
- `POST /contenido/rubrica` - Crea rúbrica
- `GET /contenido/rubrica/:componenteId` - Obtiene rúbrica
- `PUT /contenido/rubrica/:rubricaId` - Actualiza rúbrica
- `DELETE /contenido/rubrica/:rubricaId` - Elimina rúbrica
- `POST /contenido/rubrica/validar` - Valida pesos
- `POST /contenido/rubrica/evaluar/:componenteId` - Evalúa con rúbrica

#### PromptTemplateController
**Ubicación**: `apps/api/src/domains/generacion/prompt-template.controller.ts`

**Endpoints:**
- `POST /prompt-templates` - Crea plantilla
- `GET /prompt-templates` - Lista plantillas (con filtros)
- `GET /prompt-templates/:id` - Obtiene plantilla
- `PUT /prompt-templates/:id` - Actualiza plantilla
- `DELETE /prompt-templates/:id` - Elimina plantilla
- `POST /prompt-templates/:id/renderizar` - Renderiza plantilla
- `POST /prompt-templates/:id/clonar` - Clona plantilla

### 5. Módulos

#### ContenidoModule
**Ubicación**: `apps/api/src/domains/contenido/contenido.module.ts`

Exporta:
- `ContenidoEdicionService`
- `RubricaService`

#### GeneracionModule (Actualizado)
**Ubicación**: `apps/api/src/domains/generacion/generacion.module.ts`

Exporta adicionales:
- `PromptTemplateService`

Controladores adicionales:
- `PromptTemplateController`

### 6. Registro en AppModule
**Ubicación**: `apps/api/src/app.module.ts`

Se agregó `ContenidoModule` a los imports.

## Dos Enfoques de API

La implementación proporciona **dos enfoques** para trabajar con el contenido:

### Enfoque 1: API REST tradicional bajo `/contenido`
- `POST /contenido/editar`
- `POST /contenido/publicar`
- `GET /contenido/historial/:componenteId`

### Enfoque 2: API RESTful bajo `/componentes` (según especificación)
- `GET /componentes/:id/contenido`
- `PUT /componentes/:id/contenido`
- `GET /componentes/:componenteId/rubrica`
- `POST /componentes/:componenteId/rubrica`

Ambos enfoques funcionan y son compatibles. El equipo puede elegir el que mejor se ajuste a sus necesidades.

## Ejemplos de Uso

### Editar Contenido (Enfoque 1)

```bash
POST /contenido/editar
Content-Type: application/json

{
  "componenteId": "componente:123",
  "contenido": {
    "markdown": "# Nueva lección\n\nContenido actualizado...",
    "palabras_estimadas": 500,
    "tiempo_lectura_minutos": 5
  },
  "cambiosDescripcion": "Actualización de introducción",
  "tipoCambio": "minor"
}
```

### Editar Contenido (Enfoque 2 - según especificación)

```bash
# 1. Cargar contenido actual en el editor
GET /componentes/componente:123/contenido

# Response:
{
  "id": "componente_contenido:456",
  "tipo": "leccion",
  "contenido": {
    "markdown": "# Lección actual\n\n...",
    "palabras_estimadas": 450,
    "tiempo_lectura_minutos": 5
  },
  "estado": "publicado"
}

# 2. Guardar cambios con versionamiento automático
PUT /componentes/componente:123/contenido
Content-Type: application/json

{
  "contenido": {
    "markdown": "# Nueva lección\n\nContenido actualizado...",
    "palabras_estimadas": 500,
    "tiempo_lectura_minutos": 5
  }
}

# Response:
{
  "id": "componente_contenido:789",
  "tipo": "leccion",
  "contenido": { ... },
  "estado": "draft" // Marcado como draft automáticamente
}
```

### Crear Rúbrica

```bash
POST /contenido/rubrica
Content-Type: application/json

{
  "componenteId": "componente:123",
  "dimensiones": [
    {
      "nombre": "Claridad de Ideas",
      "peso": 40,
      "descriptores": [
        {
          "nivel": "Excelente",
          "puntos": 100,
          "descripcion": "Las ideas son claras, coherentes y bien estructuradas"
        },
        {
          "nivel": "Bueno",
          "puntos": 75,
          "descripcion": "Las ideas son claras pero podrían mejorar en estructura"
        }
      ]
    },
    {
      "nombre": "Uso de Evidencia",
      "peso": 60,
      "descriptores": [
        {
          "nivel": "Excelente",
          "puntos": 100,
          "descripcion": "Evidencia sólida y bien integrada"
        },
        {
          "nivel": "Bueno",
          "puntos": 75,
          "descripcion": "Evidencia presente pero podría ser más relevante"
        }
      ]
    }
  ],
  "pesosValidados": true
}
```

### Evaluar con Rúbrica

```bash
POST /contenido/rubrica/evaluar/componente:123
Content-Type: application/json

{
  "Claridad de Ideas": "Excelente",
  "Uso de Evidencia": "Bueno"
}

// Response:
{
  "rubricaId": "rubrica_evaluacion:456",
  "puntajeTotal": 85,
  "resultados": [
    {
      "dimension": "Claridad de Ideas",
      "nivel": "Excelente",
      "puntos": 100,
      "peso": 40,
      "puntajePonderado": 40
    },
    {
      "dimension": "Uso de Evidencia",
      "nivel": "Bueno",
      "puntos": 75,
      "peso": 60,
      "puntajePonderado": 45
    }
  ]
}
```

### Crear Plantilla de Prompt

```bash
POST /prompt-templates
Content-Type: application/json

{
  "nombre": "Lección de Introducción",
  "descripcion": "Plantilla para lecciones introductorias",
  "tipoComponente": "leccion",
  "promptTemplate": "Genera una lección sobre {{ tema }} para el programa {{ programa_nombre }}. El nivel de profundidad debe ser {{ nivel_profundidad }}/5.",
  "configDefault": {
    "modelo_ia": "gpt-4o-mini",
    "temperatura": 0.7
  },
  "autor": "Instructor Juan",
  "esOficial": false
}
```

### Renderizar Plantilla

```bash
POST /prompt-templates/prompt_template:789/renderizar
Content-Type: application/json

{
  "variables": {
    "tema": "Interfaces en TypeScript",
    "programa_nombre": "Curso de TypeScript Avanzado",
    "nivel_profundidad": "4"
  }
}

// Response:
{
  "plantillaId": "prompt_template:789",
  "promptRenderizado": "Genera una lección sobre Interfaces en TypeScript para el programa Curso de TypeScript Avanzado. El nivel de profundidad debe ser 4/5."
}
```

## Lógica de Versionamiento

### Flujo de Edición Protegida

1. **Contenido en Draft**:
   - Se sobrescribe directamente
   - No se crea versión

2. **Contenido Publicado**:
   - Se crea un snapshot en `version_contenido`
   - Se crea un nuevo `componente_contenido` en estado 'draft'
   - El puntero del componente apunta al nuevo draft

3. **Publicación**:
   - Cambia el estado de 'draft' a 'publicado'
   - Futuras ediciones crearán versiones automáticamente

### Flujo de Restauración

1. Se obtiene el snapshot de la versión a restaurar
2. Se crea un nuevo `componente_contenido` basado en el snapshot
3. Se actualiza el puntero del componente
4. Se registra el rollback en `rollback_historia`

## Sistema de Rúbricas

### Estructura de una Rúbrica

Una rúbrica está compuesta por:
- **Dimensiones**: Aspectos a evaluar (ej. "Claridad de Ideas")
- **Peso**: Importancia de cada dimensión (debe sumar 100%)
- **Descriptores**: Niveles de logro con puntos (0-100)

### Validación de Pesos

El sistema valida que los pesos de las dimensiones suman exactamente 100 (con margen de error de 0.01).

### Evaluación

La evaluación se realiza seleccionando un nivel (descriptor) para cada dimensión. El puntaje total es la suma ponderada de los puntos de cada dimensión.

## Biblioteca de Plantillas de Prompts

### Variables Soportadas

Las plantillas pueden incluir variables con la sintaxis `{{ variable }}`:

- `{{ programa_nombre }}`
- `{{ fase_nombre }}`
- `{{ proof_point_nombre }}`
- `{{ nivel_nombre }}`
- `{{ componente_nombre }}`
- Y cualquier variable personalizada

### Plantillas Oficiales

Las plantillas marcadas como `esOficial = true`:
- Solo pueden ser actualizadas por administradores
- No pueden ser eliminadas
- Pueden ser clonadas por cualquier usuario

## Próximos Pasos

### Frontend (Pendiente)

1. **Componente de Edición de Contenido**:
   - Integrar con los endpoints de edición
   - Mostrar estado del contenido (draft/publicado)
   - Botón de publicar con confirmación

2. **Historial de Versiones**:
   - Lista de versiones con fecha y autor
   - Vista de comparación entre versiones
   - Botón de restaurar versión

3. **Editor de Rúbricas**:
   - Formulario para crear/editar dimensiones
   - Validación en tiempo real de pesos
   - Preview de la rúbrica

4. **Biblioteca de Plantillas**:
   - Lista de plantillas con filtros
   - Editor de plantillas con resaltado de variables
   - Preview de plantilla renderizada
   - Botón de clonar plantilla

### Mejoras Futuras

1. **Permisos Granulares**:
   - Implementar verificación de permisos por rol
   - Solo instructores pueden editar contenido
   - Solo admins pueden gestionar plantillas oficiales

2. **Detección de Conflictos**:
   - Implementar la tabla `conflicto_version`
   - Alertar cuando dos usuarios editan simultáneamente

3. **Flujo de Aprobación**:
   - Implementar la tabla `aprobacion_version`
   - Requerir aprobación antes de publicar

4. **Evaluación con IA**:
   - Integrar IA para evaluar automáticamente usando las rúbricas
   - Generar feedback basado en los descriptores

5. **Diff Visual**:
   - Implementar un diff visual entre versiones
   - Resaltar cambios específicos en el contenido

## Comandos Útiles

### Aplicar Esquema de Base de Datos

```bash
cd packages/database
npm run init:dev
```

### Ejecutar API en Modo Desarrollo

```bash
cd apps/api
npm run dev
```

### Verificar Compilación TypeScript

```bash
cd apps/api
npm run build
```

## Notas Importantes

1. **Checksum**: Todas las versiones incluyen un checksum MD5 del snapshot para verificar integridad.

2. **Índices**: Los índices en las tablas de base de datos optimizan las consultas por componente, usuario y fecha.

3. **Timestamps**: Todos los registros incluyen timestamps automáticos (`created_at`, `updated_at`).

4. **Record Links**: Se utilizan record links de SurrealDB para relacionar tablas de forma eficiente.

5. **Transacciones**: Las operaciones críticas (como crear contenido y actualizar punteros) se realizan en transacciones.

## Conclusión

La Fase 4 implementa un sistema robusto de edición de contenido con versionamiento automático, un sistema de rúbricas para evaluación, y una biblioteca de plantillas de prompts reutilizables. El backend está completo y listo para ser integrado con el frontend.
