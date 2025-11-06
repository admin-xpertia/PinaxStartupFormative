# API Migration Guide: Component System → Exercise System

**Date:** 2025-11-06
**Status:** Active Migration
**Target Completion:** TBD

---

## Overview

The Xpertia Platform API has been refactored from a rigid 5-level hierarchy to a flexible 3-level hierarchy with template-based exercises.

### Architecture Change

**OLD (Deprecated):**
```
Programa → Fase → ProofPoint → Nivel → Componente
                                         ├─ leccion
                                         ├─ cuaderno
                                         ├─ simulacion
                                         └─ herramienta (4 hardcoded types)
```

**NEW (Current):**
```
Programa → Fase → ProofPoint → ExerciseInstance
                                └─ Based on ExerciseTemplate (10+ flexible types)
```

---

## Breaking Changes

### Removed Endpoints

The following endpoints have been **removed** and will return `404 Not Found`:

#### Content Management
```http
❌ GET    /api/v1/componentes/:id/contenido
❌ PUT    /api/v1/componentes/:id/contenido
```

**Replacement:**
```http
✅ GET    /api/v1/exercise-instances/:id/content
✅ POST   /api/v1/exercise-generation/:instanceId
```

#### Rubric Management
```http
❌ GET    /api/v1/componentes/:componenteId/rubrica
❌ POST   /api/v1/componentes/:componenteId/rubrica
```

**Replacement:** Rubrics are now part of the exercise template schema. Configure them when creating the template.

---

## New Endpoints

### Exercise Instances

#### Get Exercise Instance
```http
GET /api/v1/exercise-instances/:id
```

**Response:**
```json
{
  "id": "exercise_instance:abc123",
  "template": "exercise_template:leccion_interactiva",
  "proof_point": "proof_point:xyz789",
  "nombre": "Introduction to Variables",
  "descripcion_breve": "Learn about variables",
  "consideraciones_contexto": "Focus on Python syntax",
  "configuracion_personalizada": {
    "duracion_estimada": 45,
    "nivel_dificultad": "basico"
  },
  "orden": 1,
  "duracion_estimada_minutos": 45,
  "estado_contenido": "publicado",
  "contenido_actual": "exercise_content:def456",
  "es_obligatorio": true,
  "created_at": "2025-11-06T10:00:00Z",
  "updated_at": "2025-11-06T10:00:00Z"
}
```

#### List Exercise Instances for Proof Point
```http
GET /api/v1/proof-points/:proofPointId/exercise-instances
```

#### Create Exercise Instance
```http
POST /api/v1/exercise-instances
Content-Type: application/json

{
  "template": "exercise_template:leccion_interactiva",
  "proof_point": "proof_point:xyz789",
  "nombre": "Introduction to Variables",
  "descripcion_breve": "Learn about variables",
  "consideraciones_contexto": "Focus on Python syntax",
  "configuracion_personalizada": {
    "duracion_estimada": 45,
    "nivel_dificultad": "basico"
  },
  "orden": 1,
  "duracion_estimada_minutos": 45,
  "es_obligatorio": true
}
```

#### Update Exercise Instance
```http
PUT /api/v1/exercise-instances/:id
```

#### Delete Exercise Instance
```http
DELETE /api/v1/exercise-instances/:id
```

---

### Exercise Templates

#### List Exercise Templates
```http
GET /api/v1/exercise-templates
```

**Response:**
```json
{
  "templates": [
    {
      "id": "exercise_template:leccion_interactiva",
      "nombre": "Lección Interactiva",
      "categoria": "leccion_interactiva",
      "descripcion": "Contenido educativo con preguntas integradas",
      "objetivo_pedagogico": "Transmitir conocimiento con validación activa",
      "rol_ia": "Experto pedagógico que estructura contenido",
      "configuracion_schema": {
        "duracion_estimada": {
          "type": "number",
          "label": "Duración (minutos)",
          "default": 30,
          "min": 10,
          "max": 120
        },
        "nivel_dificultad": {
          "type": "select",
          "label": "Nivel de dificultad",
          "options": ["basico", "intermedio", "avanzado"],
          "default": "intermedio"
        }
      },
      "icono": "📚",
      "color": "#3B82F6",
      "es_oficial": true,
      "activo": true
    }
  ]
}
```

#### Get Exercise Template
```http
GET /api/v1/exercise-templates/:id
```

---

### Exercise Content

#### Get Exercise Content
```http
GET /api/v1/exercise-instances/:instanceId/content
```

**Response:**
```json
{
  "id": "exercise_content:def456",
  "exercise_instance": "exercise_instance:abc123",
  "contenido": {
    "markdown": "# Introduction to Variables\n\nVariables are...",
    "palabras_estimadas": 450,
    "tiempo_lectura_minutos": 5
  },
  "estado": "publicado",
  "version": 1,
  "generacion_request": "generacion_request:ghi789",
  "created_at": "2025-11-06T10:00:00Z",
  "updated_at": "2025-11-06T10:00:00Z"
}
```

---

### Exercise Generation (AI)

#### Generate Exercise Content
```http
POST /api/v1/exercise-generation/:instanceId
Content-Type: application/json

{
  "configuracion": {
    "modelo": "claude-3-5-sonnet",
    "temperatura": 0.7,
    "incluir_ejemplos": true
  },
  "prompt_adicional": "Focus on practical examples"
}
```

**Response:**
```json
{
  "generacion_request": {
    "id": "generacion_request:ghi789",
    "exercise_instance": "exercise_instance:abc123",
    "estado": "pending",
    "created_at": "2025-11-06T10:00:00Z"
  }
}
```

#### Check Generation Status
```http
GET /api/v1/exercise-generation/:requestId/status
```

**Response:**
```json
{
  "id": "generacion_request:ghi789",
  "estado": "completed",
  "exercise_content": "exercise_content:def456",
  "created_at": "2025-11-06T10:00:00Z",
  "completed_at": "2025-11-06T10:01:30Z"
}
```

#### Batch Generate for Proof Point
```http
POST /api/v1/exercise-generation/proof-point/:proofPointId/batch
```

Generates content for all exercise instances in a proof point.

---

## Migration Examples

### Example 1: Loading Content for Display

**OLD:**
```typescript
// ❌ Deprecated
const response = await fetch(`/api/v1/componentes/${componenteId}/contenido`);
const contenido = await response.json();
```

**NEW:**
```typescript
// ✅ Current
const response = await fetch(`/api/v1/exercise-instances/${instanceId}/content`);
const content = await response.json();
```

### Example 2: Updating Content

**OLD:**
```typescript
// ❌ Deprecated - Manual editing
await fetch(`/api/v1/componentes/${componenteId}/contenido`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contenido: { markdown: "...", palabras_estimadas: 500 }
  })
});
```

**NEW:**
```typescript
// ✅ Current - AI regeneration
await fetch(`/api/v1/exercise-generation/${instanceId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    configuracion: { temperatura: 0.7 },
    prompt_adicional: "Add more examples"
  })
});
```

### Example 3: Creating a New Exercise

**OLD:**
```typescript
// ❌ Deprecated - Componente creation
await fetch(`/api/v1/componentes`, {
  method: 'POST',
  body: JSON.stringify({
    nivel: "nivel:xyz",
    tipo: "leccion",
    nombre: "Variables",
    duracion_estimada_minutos: 45
  })
});
```

**NEW:**
```typescript
// ✅ Current - Exercise instance creation
await fetch(`/api/v1/exercise-instances`, {
  method: 'POST',
  body: JSON.stringify({
    template: "exercise_template:leccion_interactiva",
    proof_point: "proof_point:xyz",
    nombre: "Variables",
    duracion_estimada_minutos: 45,
    configuracion_personalizada: {
      nivel_dificultad: "basico"
    }
  })
});
```

---

## Data Model Changes

### Removed Tables
- `nivel`
- `componente`
- `prerequisitos_componente`
- `progreso_nivel`
- `progreso_componente`
- `datos_estudiante` (old structure)
- `evaluacion_resultado` (old structure)
- `feedback_generado` (old structure)
- All `snapshot_*` tables (7 tables)

### New Tables
- `exercise_template` - Catalog of exercise types
- `exercise_instance` - Instances applied to proof points
- `exercise_content` - AI-generated content
- `exercise_progress` - Simplified student progress tracking

---

## TypeScript Types Migration

### Deprecated Types
```typescript
// ❌ Deprecated
import { Componente, Nivel, ProgresoComponente } from '@xpertia/database';
```

### New Types
```typescript
// ✅ Current
import {
  ExerciseTemplate,
  ExerciseInstance,
  ExerciseContent,
  ExerciseProgress
} from '@xpertia/database';
```

---

## Testing Your Migration

### 1. Verify Old Endpoints Return 404
```bash
curl -X GET http://localhost:3000/api/v1/componentes/test123/contenido
# Expected: 404 Not Found
```

### 2. Test New Endpoints
```bash
# List templates
curl -X GET http://localhost:3000/api/v1/exercise-templates

# Create instance
curl -X POST http://localhost:3000/api/v1/exercise-instances \
  -H "Content-Type: application/json" \
  -d '{
    "template": "exercise_template:leccion_interactiva",
    "proof_point": "proof_point:test",
    "nombre": "Test Exercise"
  }'

# Generate content
curl -X POST http://localhost:3000/api/v1/exercise-generation/INSTANCE_ID \
  -H "Content-Type: application/json" \
  -d '{"configuracion": {"temperatura": 0.7}}'
```

---

## Support & Questions

For questions or issues during migration:
- See [LEGACY_CLEANUP.md](./LEGACY_CLEANUP.md) for detailed cleanup steps
- Check [apps/api/src/domains/ejercicios/README.md](./apps/api/src/domains/ejercicios/README.md) for implementation details
- Review migration files in [packages/database/migrations/](./packages/database/migrations/)

---

## Deprecation Timeline

- **Phase 1 (Week 1-2):** Backend cleanup completed ✅
- **Phase 2 (Week 3-4):** Frontend migration in progress 🔄
- **Phase 3 (Week 5-6):** Final cleanup and documentation
- **Phase 4 (Week 7+):** Legacy code removal

**Last Updated:** 2025-11-06
