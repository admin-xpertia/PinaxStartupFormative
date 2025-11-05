# Servicio de Generación de Contenido con IA

Este módulo implementa la generación de contenido asistida por IA para la plataforma Xpertia, utilizando OpenAI para crear recursos educativos (lecciones, cuadernos, simulaciones y herramientas).

## Arquitectura

### Flujo de Generación

1. **Solicitud de Generación** → Se crea un registro en `generacion_request`
2. **Llamada a OpenAI** → Se construye un prompt contextualizado y se envía a la API
3. **Parseo de Respuesta** → Se valida y parsea el JSON devuelto por la IA
4. **Guardado en BD** → Se persiste en 3 tablas:
   - `contenido_generado`: Respuesta cruda y metadata
   - `validacion_calidad`: Análisis de calidad (si existe)
   - `componente_contenido`: Contenido final con link a validación
5. **Actualización de Estado** → Se marca la solicitud como completada

### Transacción de Base de Datos

El servicio utiliza transacciones de SurrealDB para garantizar consistencia:

```sql
BEGIN TRANSACTION;

-- 1. Crear validación de calidad
LET $validacion = CREATE validacion_calidad CONTENT {
  score_general: ...,
  metricas: {...},
  sugerencias: [...],
  comparacion_objetivos: [...]
};

-- 2. Crear componente_contenido y linkear validación
LET $contenido = CREATE componente_contenido CONTENT {
  componente: type::thing("componente", "..."),
  tipo: "leccion",
  contenido: {...},
  estado: 'draft',
  validacion_calidad: $validacion.id
};

-- 3. Actualizar componente para apuntar a la nueva versión
UPDATE componente SET version_contenido_actual = $contenido.id;

COMMIT TRANSACTION;
```

## Uso del Servicio

### Endpoint

```
POST /api/v1/generacion/contenido
```

### Request Body

```typescript
{
  // Contexto del programa
  faseId: "fase:abc123",
  componenteId: "componente:xyz789",
  programa_nombre: "Programa de Innovación",
  fase_nombre: "Fase 2 - Validación",
  proof_point_nombre: "MVP Inicial",
  proof_point_pregunta: "¿Cómo validarías tu hipótesis de mercado?",
  nivel_nombre: "Nivel 1 - Fundamentos",
  nivel_objetivo: "Comprender la importancia de validar hipótesis",

  // Configuración del contenido a generar
  tipo_componente: "leccion", // leccion | cuaderno | simulacion | herramienta
  nombre_componente: "Introducción al MVP",
  nivel_profundidad: 3, // 1-5
  estilo_narrativo: "conversacional", // academico | conversacional | narrativo | socratico
  duracion_target: 30, // minutos

  // Personalización
  conceptos_enfatizar: ["MVP", "validación", "hipótesis"],
  casos_incluir: ["Dropbox", "Airbnb"],
  elementos_incluir: ["ejemplos", "ejercicios"],
  instrucciones_adicionales: "Enfócate en startups tech...",

  // Configuración de IA
  modelo_ia: "gpt-4o-mini", // opcional
  temperatura: 0.7 // 0-2, opcional
}
```

### Response

```typescript
{
  contenido: {
    // Estructura del contenido generado (varía según tipo_componente)
    titulo: "Introducción al MVP",
    secciones: [...]
  },
  analisis_calidad: {
    score_general: 8.5,
    metricas: {
      claridad: 9,
      relevancia: 8,
      profundidad: 7
    },
    sugerencias: ["Agregar más ejemplos prácticos"],
    comparacion_objetivos: [...]
  },
  componente_contenido_id: "componente_contenido:abc123"
}
```

## Tablas de Base de Datos

### `generacion_request`
Rastrea todas las solicitudes de generación de contenido.

**Campos:**
- `componente`: Record link al componente
- `solicitado_por`: Record link al usuario
- `configuracion`: Objeto con la configuración usada
- `prompt_usado`: Prompt enviado a OpenAI
- `estado`: pending | processing | completed | failed
- `error_message`: Mensaje de error si falla
- `created_at`, `completed_at`: Timestamps

### `contenido_generado`
Almacena la respuesta cruda de OpenAI y metadata.

**Campos:**
- `generacion_request`: Record link a la solicitud
- `contenido_raw`: String JSON de la respuesta
- `metadata`: Objeto con modelo, versión, etc.
- `tokens_usados`: Total de tokens consumidos
- `costo_estimado`: Costo estimado en USD
- `generated_at`: Timestamp

### `validacion_calidad`
Análisis de calidad generado por la IA.

**Campos:**
- `score_general`: Float (0-10)
- `metricas`: Objeto con métricas detalladas
- `sugerencias`: Array de sugerencias de mejora
- `comparacion_objetivos`: Array comparando con objetivos de aprendizaje

### `componente_contenido`
Versiones de contenido del componente.

**Campos:**
- `componente`: Record link al componente
- `tipo`: leccion | cuaderno | simulacion | herramienta
- `contenido`: Objeto JSON polimórfico con el contenido
- `estado`: draft | publicado
- `validacion_calidad`: Record link opcional a validación
- `created_at`: Timestamp

## Sistema de Construcción de Prompts

### Arquitectura del Prompt

El método `_buildPrompt` construye prompts estructurados en 6 secciones clave:

#### 1. **El Rol (Persona)**
Establece la autoridad y propósito del LLM:
```
Eres "Xpertia-AI", un diseñador instruccional experto de clase mundial...
```

#### 2. **Contexto Jerárquico**
Ubica el contenido en la estructura del programa:
- Programa → Fase → Proof Point → Nivel → Componente

#### 3. **Conocimiento del Instructor** 🧠 (CRÍTICO)
Serializa la `FaseDocumentation` con:
- Contexto general de la fase
- Conceptos clave con definiciones y ejemplos
- Casos de estudio relevantes
- Errores comunes a evitar
- Recursos de referencia
- Criterios de evaluación

**Formato optimizado para LLMs:**
```markdown
## Conceptos Clave:
**Item 1:**
  - **nombre:** MVP
  - **definicion:** La versión más simple...
  - **ejemplo:** Dropbox usó un video...
```

#### 4. **Tarea Específica**
Instrucciones bifurcadas por tipo de componente:
- **Lección**: Markdown estructurado con ejemplos
- **Cuaderno**: Secciones con preguntas y ejemplos de respuesta
- **Simulación**: Personaje, escenario y banco de respuestas
- **Herramienta**: Framework práctico con pasos

#### 5. **Auto-Análisis de Calidad**
La IA evalúa su propio trabajo con 5 métricas:
1. Lecturabilidad (0-100)
2. Cobertura de Conceptos (0-100)
3. Alineación con Objetivos (0-100)
4. Uso de Documentación (0-100)
5. Profundidad Pedagógica (0-100)

#### 6. **Formato de Salida JSON** (CRÍTICO)
Esquema JSON detallado que varía según tipo:

**Para Lección:**
```json
{
  "contenido": {
    "markdown": "string",
    "palabras_estimadas": "number",
    "tiempo_lectura_minutos": "number"
  },
  "analisis_calidad": {
    "score_general": "number (0-100)",
    "metricas": { ... },
    "sugerencias": [ ... ],
    "comparacion_objetivos": [ ... ]
  }
}
```

### Métodos Auxiliares

#### `_formatJsonForPrompt(data, ...fields)`
Formatea arrays de objetos de la documentación para máxima legibilidad:
```typescript
_formatJsonForPrompt(conceptos, "nombre", "definicion", "ejemplo")
// Genera formato estructurado y fácil de parsear para el LLM
```

#### `_getJsonOutputSchema(tipo)`
Retorna el esquema JSON esperado según el tipo de componente.
Asegura consistencia en las respuestas de la IA.

#### `_buildLeccionInstructions(config)`
Genera instrucciones específicas para lecciones con restricciones.

#### `_buildCuadernoInstructions(config)`
Genera instrucciones para cuadernos incluyendo tipos de preguntas.

#### `_buildSimulacionInstructions(config)`
Genera instrucciones para simulaciones con configuración de personaje.

### Ejemplo de Prompt Completo

```markdown
Eres "Xpertia-AI", un diseñador instruccional experto...

# CONTEXTO DEL COMPONENTE
- **Programa:** Programa de Innovación Empresarial
- **Fase:** Fase 2 - Validación de Mercado
- **Proof Point:** MVP Inicial
  - Pregunta Central: "¿Cómo validarías tu hipótesis?"
- **Nivel:** Nivel 1 - Fundamentos
  - Objetivo: "Comprender la importancia de validar hipótesis"

# CONOCIMIENTO DEL INSTRUCTOR
## Contexto General:
En esta fase, los estudiantes aprenden a validar...

## Conceptos Clave:
**Item 1:**
  - **nombre:** Minimum Viable Product (MVP)
  - **definicion:** La versión más simple...
  - **ejemplo:** Dropbox usó un video de 3 minutos...

## Casos de Estudio:
**Item 1:**
  - **titulo:** El Video MVP de Dropbox
  - **tipo:** exito
  - **descripcion:** Drew Houston creó un video...

# TAREA DE GENERACIÓN
## Instrucciones para Lección:
- Genera contenido completo en Markdown
- Estructura con introducción, desarrollo, conclusión
...

# TAREA DE ANÁLISIS DE CALIDAD
Evalúa tu trabajo con 5 métricas (0-100)...

# FORMATO DE SALIDA
```json
{ ... }
```
```

### Pruebas de Prompt

Para probar el prompt antes de hacer llamadas a OpenAI:

```bash
npx ts-node apps/api/test-prompt-builder.ts
```

Este script:
1. Genera un prompt con datos de ejemplo
2. Muestra el prompt completo
3. Calcula tokens estimados
4. Proporciona instrucciones para probar en OpenAI Playground

## Manejo de Errores

El servicio maneja errores de forma robusta:

1. **Validación de entrada**: DTOs con class-validator
2. **Errores de OpenAI**: Se capturan y registran
3. **Errores de BD**: Se revierten transacciones
4. **Estado de solicitud**: Se marca como 'failed' con mensaje de error

## Costos y Límites

- **Modelo por defecto**: gpt-4o-mini
- **Temperatura por defecto**: 0.7
- **Estimación de costo**: ~$0.02 USD por 1k tokens
- **Timeout**: 2 minutos (configurable)

## Próximos Pasos

1. ✅ Esquema de BD implementado
2. ✅ Servicio de generación con guardado en BD
3. 🔲 Endpoint de preview para instructores
4. 🔲 Endpoint de publicación (draft → publicado)
5. 🔲 Sistema de feedback sobre contenido generado
6. 🔲 Fine-tuning con feedback acumulado
7. 🔲 Versionamiento de contenido
8. 🔲 Comparación de versiones

## Testing

Para probar el servicio:

```bash
# Asegúrate de tener OPENAI_API_KEY en .env
npm run start:dev

# Hacer una solicitud de prueba
curl -X POST http://localhost:3000/api/v1/generacion/contenido \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @test-generation-request.json
```
