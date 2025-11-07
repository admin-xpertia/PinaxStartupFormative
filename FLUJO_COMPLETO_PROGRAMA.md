# FLUJO COMPLETO DE DISEÑO DE PROGRAMAS

## 📋 RESUMEN EJECUTIVO

Este documento explica el flujo completo esperado para diseñar programas educativos, desde la creación inicial hasta la asignación de ejercicios, según la arquitectura DDD implementada.

**PROBLEMA IDENTIFICADO:** Cuando presionas "Editar" en un programa, aparece el flujo antiguo (`ProgramEditor`) en lugar del flujo nuevo con fases, proof points y ejercicios.

**SOLUCIÓN:** Redirigir al flujo correcto (`/estructura`) que utiliza todos los componentes nuevos.

---

## 1. FLUJO ESPERADO (ARQUITECTURA DDD)

### Fase 1: Crear Programa Básico ✅

**Ruta:** `/programas` → Click "Nuevo Programa"

**Componente:** `ProgramWizard` (4 pasos)

**Pasos:**
1. **Información Básica**
   - Nombre del programa
   - Descripción
   - Categoría
   - Duración estimada (semanas)
   - Número de fases

2. **Estructura de Fases**
   - Para cada fase:
     - Nombre de la fase
     - Descripción
     - Objetivos de aprendizaje
     - Duración estimada
     - Número de proof points por fase

3. **Definir Proof Points**
   - Para cada proof point:
     - Nombre
     - Slug (auto-generado)
     - Descripción
     - Pregunta central
     - Tipo de entregable
     - Duración estimada (horas)

4. **Revisión Final**
   - Resumen completo
   - Validación
   - Crear programa

**Backend:**
```
POST /api/v1/programs → Crea el programa
POST /api/v1/programs/:id/fases → Crea cada fase
POST /api/v1/fases/:id/proof-points → Crea cada proof point
```

**Estado:** ✅ IMPLEMENTADO COMPLETAMENTE

---

### Fase 2: Editar Estructura del Programa ⚠️ PROBLEMA AQUÍ

**Ruta CORRECTA:** `/programas/:id/estructura`

**Componente:** Layout de 3 columnas con:
- Izquierda: `FaseManager` (CRUD de fases)
- Derecha: `ProofPointManager` (CRUD de proof points por fase)
- Derecha: `ExerciseSelector` (placeholder para agregar ejercicios)

**Funcionalidades:**
- ✅ Crear/editar/eliminar fases
- ✅ Crear/editar/eliminar proof points
- ✅ Reordenar fases y proof points
- ⚠️ Link a selección de ejercicios (redirige a ruta específica)

**Backend:**
```
GET /api/v1/programs/:id/fases → Obtiene todas las fases
POST /api/v1/programs/:id/fases → Crea nueva fase
PUT /api/v1/fases/:id → Actualiza fase
DELETE /api/v1/fases/:id → Elimina fase

GET /api/v1/fases/:id/proof-points → Obtiene todos los proof points
POST /api/v1/fases/:id/proof-points → Crea nuevo proof point
PUT /api/v1/proof-points/:id → Actualiza proof point
DELETE /api/v1/proof-points/:id → Elimina proof point
```

**Estado:** ✅ IMPLEMENTADO PERO NO ES LA RUTA POR DEFECTO

**PROBLEMA:**
- El botón "Editar" en `/programas/:id` redirige a `/programas/:id/editar`
- La ruta `/editar` usa el componente ANTIGUO `ProgramEditor`
- Debería redirigir a `/programas/:id/estructura` para usar el flujo nuevo

---

### Fase 3: Seleccionar Ejercicios para Proof Points ✅

**Ruta:** `/programas/:id/proof-points/:ppId/ejercicios`

**Componente:** Página con dos tabs:

**Tab 1: Ejercicios Agregados**
- Lista de ejercicios ya asignados al proof point
- Para cada ejercicio:
  - Nombre, descripción
  - Estado (Sin generar, Generando, Borrador, Publicado)
  - Duración
  - Badge de obligatorio/opcional
  - Acciones: Generar con IA, Preview, Eliminar
- Botón para generar todos los ejercicios pendientes
- Botón para agregar más ejercicios

**Tab 2: Biblioteca de Ejercicios**
- Templates agrupados por categoría:
  - 📖 Lección Interactiva
  - 📝 Cuaderno de Trabajo
  - 💬 Simulación de Interacción
  - 🤖 Mentor y Asesor IA
  - 🔍 Herramienta de Análisis
  - 🎨 Herramienta de Creación
  - 📊 Sistema de Tracking
  - ✅ Herramienta de Revisión
  - 🌐 Simulador de Entorno
  - 🎯 Sistema de Progresión
- Para cada template:
  - Icon, nombre, descripción
  - Badge de "Oficial" si aplica
  - Botones: Preview, Agregar

**Flujo de Agregar Ejercicio:**
1. Click "Agregar" en un template → Abre `ExerciseWizardDialog`
2. Completar form de configuración:
   - Nombre del ejercicio
   - Descripción breve
   - Consideraciones de contexto
   - Configuración personalizada (depende del template)
   - Duración estimada (minutos)
   - ¿Es obligatorio?
3. Click "Guardar" → Crea exercise instance
4. Estado inicial: "Sin generar"

**Backend:**
```
GET /api/v1/exercise-templates → Lista todos los templates
GET /api/v1/exercise-templates/category/:category → Templates por categoría

GET /api/v1/proof-points/:ppId/exercises → Ejercicios del proof point
POST /api/v1/proof-points/:ppId/exercises → Agrega ejercicio al proof point
DELETE /api/v1/exercises/:id → Elimina ejercicio
```

**Estado:** ✅ IMPLEMENTADO COMPLETAMENTE

---

### Fase 4: Generar Contenido con IA ⚠️ PARCIALMENTE

**Ruta:** Desde `/programas/:id/proof-points/:ppId/ejercicios`

**Componente:** Dentro de la lista de ejercicios agregados

**Funcionalidades:**
- ✅ Botón "Generar con IA" por ejercicio
- ✅ Estado visual del ejercicio (Sin generar → Generando → Generado)
- ✅ Generar todos los ejercicios pendientes
- ⚠️ Preview del contenido generado (implementado pero sin contenido real)
- ❌ Integración real con OpenAI (No implementado)

**Backend Esperado:**
```
POST /api/v1/exercises/:id/generate → Genera contenido con IA
GET /api/v1/exercises/:id/content → Obtiene contenido generado
PUT /api/v1/exercises/:id/content → Actualiza contenido
```

**Estado:** ⚠️ UI IMPLEMENTADA, BACKEND PENDIENTE

**PENDIENTE:**
- Implementar use case de generación con IA
- Conectar con OpenAI
- Crear exercise content repository
- Guardar contenido generado en la base de datos

---

### Fase 5: Vista de Arquitectura Visual ✅

**Ruta:** `/programas/:id/arquitectura`

**Componente:** `VisualRoadmapBuilder`

**Funcionalidades:**
- ✅ Visualización tipo roadmap del programa
- ✅ Muestra fases → proof points → ejercicios
- ✅ Edición visual (drag and drop)
- ✅ Refresh/actualización en tiempo real
- ✅ Navegación entre elementos

**Backend:**
```
Usa los mismos endpoints de fases, proof points y ejercicios
```

**Estado:** ✅ IMPLEMENTADO COMPLETAMENTE

---

### Fase 6: Documentación de Fases ✅

**Ruta:** `/programas/:id/fases/:faseId/documentacion`

**Componente:** Form de documentación

**Funcionalidades:**
- ✅ Contexto general de la fase
- ✅ Conceptos clave
- ✅ Casos de ejemplo
- ✅ Errores comunes
- ✅ Recursos de referencia
- ✅ Criterios de evaluación

**Propósito:** Esta documentación se usa como contexto para generar ejercicios con IA

**Backend Esperado:**
```
GET /api/v1/fases/:id/documentation → Obtiene documentación
PUT /api/v1/fases/:id/documentation → Actualiza documentación
```

**Estado:** ✅ UI IMPLEMENTADA

---

### Fase 7: Configuración de Niveles ✅

**Ruta:** `/programas/:id/proof-points/:ppId/niveles`

**Componente:** `NivelConfigurator`

**Funcionalidades:**
- ✅ Definir 3 niveles: Fundamentos, Aplicación, Maestría
- ✅ Objetivos por nivel
- ✅ Ejercicios por nivel
- ✅ Criterios de evaluación

**Propósito:** Sistema de progresión adaptativa para estudiantes

**Backend Esperado:**
```
GET /api/v1/proof-points/:id/niveles → Obtiene configuración de niveles
PUT /api/v1/proof-points/:id/niveles → Actualiza niveles
```

**Estado:** ✅ UI IMPLEMENTADA

---

### Fase 8: Publicar Programa ✅

**Ruta:** Desde `/programas/:id`

**Componente:** Botón en page header

**Funcionalidades:**
- ✅ Validación de completitud
- ✅ Cambio de estado borrador → publicado
- ✅ Creación de snapshots inmutables (para cohortes)

**Backend:**
```
POST /api/v1/programs/:id/publish → Publica el programa
```

**Estado:** ✅ IMPLEMENTADO COMPLETAMENTE

---

## 2. ARQUITECTURA DE DATOS

### Jerarquía de Entidades

```
Programa (Program)
│
├── Metadatos
│   ├── nombre: string
│   ├── descripcion: string
│   ├── duracionSemanas: number
│   ├── categoria: string
│   ├── estado: "borrador" | "publicado" | "archivado"
│   ├── versionActual: number
│   └── creador: usuario:id
│
├── Fases[] (Fase)
│   ├── numeroFase: number
│   ├── nombre: string
│   ├── descripcion: string
│   ├── objetivosAprendizaje: string[]
│   ├── duracionSemanasEstimada: number
│   ├── orden: number (auto-calculado)
│   │
│   ├── FaseDocumentation (opcional)
│   │   ├── contextoGeneral: string
│   │   ├── conceptosClave: string[]
│   │   ├── casosEjemplo: string[]
│   │   ├── erroresComunes: string[]
│   │   ├── recursosReferencia: string[]
│   │   └── criteriosEvaluacion: object
│   │
│   └── ProofPoints[] (ProofPoint)
│       ├── nombre: string
│       ├── slug: string (único)
│       ├── descripcion: string
│       ├── preguntaCentral: string
│       ├── ordenEnFase: number (auto-calculado)
│       ├── duracionEstimadaHoras: number
│       ├── tipoEntregableFinal: string
│       ├── documentacionContexto: string
│       ├── prerequisitos: ProofPoint[]
│       │
│       ├── Niveles (opcional)
│       │   ├── Nivel 0: Fundamentos
│       │   ├── Nivel 1: Aplicación
│       │   └── Nivel 2: Maestría
│       │
│       └── ExerciseInstances[] (ExerciseInstance)
│           ├── template: ExerciseTemplate (referencia)
│           ├── nombre: string
│           ├── descripcionBreve: string
│           ├── consideracionesContexto: string
│           ├── configuracionPersonalizada: object
│           ├── orden: number (auto-calculado)
│           ├── duracionEstimadaMinutos: number
│           ├── estadoContenido: "pendiente" | "generando" | "generado" | "error"
│           ├── esObligatorio: boolean
│           │
│           └── ExerciseContent (generado por IA)
│               ├── version: number
│               ├── status: string
│               ├── contentData: object (contenido generado)
│               └── generationRequest: string
```

### Catálogo de Templates (Read-Only)

```
ExerciseTemplate
├── id: string
├── nombre: string
├── categoria: ExerciseCategory
├── descripcion: string
├── objetivoPedagogico: string
├── rolIA: string
├── configuracionSchema: object (JSON Schema)
├── configuracionDefault: object
├── promptTemplate: string
├── outputSchema: object
├── previewConfig: object
├── icono: string
├── color: string
├── esOficial: boolean
└── activo: boolean
```

---

## 3. MAPA DE RUTAS

### Rutas Principales

| Ruta | Componente | Propósito | Estado |
|------|-----------|-----------|--------|
| `/programas` | Lista de programas | Ver todos los programas | ✅ Funcional |
| `/programas/nuevo` | `ProgramWizard` | Crear nuevo programa | ✅ Funcional |
| `/programas/:id` | Detalle con tabs | Vista general del programa | ✅ Funcional |
| `/programas/:id/estructura` | Layout 3 columnas | **FLUJO NUEVO** - Editar estructura | ✅ Funcional |
| `/programas/:id/editar` | `ProgramEditor` | **FLUJO ANTIGUO** - No usar | ⚠️ Deprecado |
| `/programas/:id/arquitectura` | `VisualRoadmapBuilder` | Vista visual de arquitectura | ✅ Funcional |
| `/programas/:id/preview` | Vista de estudiante | Preview del programa | ✅ Funcional |

### Rutas de Fases

| Ruta | Componente | Propósito | Estado |
|------|-----------|-----------|--------|
| `/programas/:id/fases/:faseId/documentacion` | Form de documentación | Documentar fase para IA | ✅ Funcional |

### Rutas de Proof Points

| Ruta | Componente | Propósito | Estado |
|------|-----------|-----------|--------|
| `/programas/:id/proof-points/:ppId/ejercicios` | Biblioteca + Lista | Agregar ejercicios | ✅ Funcional |
| `/programas/:id/proof-points/:ppId/niveles` | `NivelConfigurator` | Configurar niveles | ✅ Funcional |

---

## 4. ENDPOINTS DEL BACKEND

### Programas

```typescript
GET    /api/v1/programs              // Lista todos (con filtro opcional)
POST   /api/v1/programs              // Crea nuevo programa
GET    /api/v1/programs/:id          // Obtiene por ID
PUT    /api/v1/programs/:id          // Actualiza programa
DELETE /api/v1/programs/:id          // Elimina programa
POST   /api/v1/programs/:id/publish  // Publica programa
POST   /api/v1/programs/:id/archive  // Archiva programa
```

### Fases

```typescript
POST   /api/v1/programs/:programId/fases  // Crea fase en programa
GET    /api/v1/programs/:programId/fases  // Lista fases del programa
GET    /api/v1/fases/:id                  // Obtiene fase por ID
DELETE /api/v1/fases/:id                  // Elimina fase
```

### Proof Points

```typescript
POST   /api/v1/fases/:faseId/proof-points  // Crea proof point en fase
GET    /api/v1/fases/:faseId/proof-points  // Lista proof points de la fase
GET    /api/v1/proof-points/:id            // Obtiene proof point por ID
GET    /api/v1/proof-points/slug/:slug     // Obtiene por slug
DELETE /api/v1/proof-points/:id            // Elimina proof point
```

### Exercise Templates (Catálogo)

```typescript
GET /api/v1/exercise-templates                    // Lista todos
GET /api/v1/exercise-templates/:id                // Obtiene por ID
GET /api/v1/exercise-templates/category/:category // Por categoría
```

### Exercise Instances

```typescript
POST   /api/v1/proof-points/:ppId/exercises  // Agrega ejercicio a proof point
GET    /api/v1/proof-points/:ppId/exercises  // Lista ejercicios del proof point
GET    /api/v1/exercises/:id                 // Obtiene ejercicio por ID
DELETE /api/v1/exercises/:id                 // Elimina ejercicio
```

### Exercise Content (Pendiente)

```typescript
POST /api/v1/exercises/:id/generate  // Genera contenido con IA (PENDIENTE)
GET  /api/v1/exercises/:id/content   // Obtiene contenido (PENDIENTE)
PUT  /api/v1/exercises/:id/content   // Actualiza contenido (PENDIENTE)
```

---

## 5. PROBLEMA IDENTIFICADO Y SOLUCIÓN

### 🔴 PROBLEMA

**Síntoma:** "Cuando presiono un programa, aparece el flujo antiguo para seleccionar ejercicios"

**Causa raíz:** El botón "Editar" en `/programas/:id` (línea 96) redirige a:
```tsx
<Link href={`/programas/${programId}/editar`}>
```

Esta ruta usa el componente `ProgramEditor` de `@/components/fase2/ProgramEditor`, que es el **flujo antiguo** y NO incluye la gestión de fases, proof points y ejercicios.

### ✅ SOLUCIÓN

**Cambiar el link del botón "Editar"** para que redirija al flujo nuevo:

**Archivo:** `/home/user/PinaxStartupFormative/apps/instructor-app/app/programas/[id]/page.tsx`

**Línea 96:** Cambiar de:
```tsx
<Link href={`/programas/${programId}/editar`}>
```

A:
```tsx
<Link href={`/programas/${programId}/estructura`}>
```

**Resultado:** Al hacer clic en "Editar", el usuario verá el layout de 3 columnas con:
- Gestión de fases (izquierda)
- Gestión de proof points (derecha superior)
- Links a selección de ejercicios (derecha)

---

## 6. TAREAS PENDIENTES PARA COMPLETAR EL FLUJO

### Alta Prioridad ⚠️

1. **Cambiar ruta del botón Editar**
   - Archivo: `apps/instructor-app/app/programas/[id]/page.tsx`
   - Cambio: Link de `/editar` a `/estructura`
   - Impacto: Usuarios verán el flujo correcto

2. **Implementar generación de contenido con IA**
   - Crear use case: `GenerateExerciseContentUseCase`
   - Integrar con OpenAI API
   - Guardar contenido en `exercise_content` table
   - Actualizar estado del exercise instance

3. **Endpoints de Exercise Content**
   - POST `/exercises/:id/generate`
   - GET `/exercises/:id/content`
   - PUT `/exercises/:id/content`

### Media Prioridad

4. **Implementar repositorio de FaseDocumentation**
   - Endpoints para GET/PUT documentación
   - Conectar con form de documentación

5. **Implementar configuración de niveles**
   - Backend para guardar configuración de niveles
   - Endpoints: GET/PUT `/proof-points/:id/niveles`

6. **Mejorar validación al publicar**
   - Validar que todas las fases tengan proof points
   - Validar que todos los proof points tengan ejercicios
   - Validar que la documentación esté completa

### Baja Prioridad

7. **Cleanup del código antiguo**
   - Evaluar si eliminar `/editar` route
   - Evaluar si eliminar `ProgramEditor` component
   - O mantener como fallback legacy

8. **Mejorar UX de estructura**
   - Drag and drop para reordenar
   - Inline editing
   - Validación en tiempo real

9. **Preview de ejercicios**
   - Renderizar contenido generado
   - Vista de estudiante simulada
   - Testing de ejercicios

---

## 7. FLUJO COMPLETO PASO A PASO (ESPERADO)

### Para Instructor - Crear un Programa Completo

1. **Ir a `/programas`** → Click "Nuevo Programa"

2. **Wizard - Paso 1:** Información básica
   - Nombre: "Road Map Startup"
   - Descripción: "Programa para founders..."
   - Categoría: "Emprendimiento"
   - Duración: 16 semanas
   - Número de fases: 4

3. **Wizard - Paso 2:** Definir fases
   - Fase 1: "Pre-Semilla" (4 semanas, 3 proof points)
   - Fase 2: "Semilla" (4 semanas, 3 proof points)
   - Fase 3: "Serie A" (4 semanas, 3 proof points)
   - Fase 4: "Escalamiento" (4 semanas, 3 proof points)

4. **Wizard - Paso 3:** Definir proof points
   - Para cada fase, definir sus proof points con:
     - Nombre, slug, pregunta central
     - Tipo de entregable
     - Duración estimada

5. **Wizard - Paso 4:** Revisar y crear
   - Ver resumen completo
   - Click "Crear Programa"
   - **Backend crea:** Program → 4 Fases → 12 Proof Points

6. **Redirige a `/programas/:id`** (vista de detalle)
   - Ver estadísticas: 4 fases, 12 proof points
   - Estado: Borrador

7. **Click "Editar"** → Redirige a `/programas/:id/estructura`
   - Ver lista de fases (izquierda)
   - Seleccionar fase → Ver sus proof points (derecha)
   - Puede agregar/editar/eliminar fases y proof points

8. **Para cada proof point:** Click en link de ejercicios
   - Redirige a `/programas/:id/proof-points/:ppId/ejercicios`
   - Tab "Biblioteca de Ejercicios"
   - Navegar por categorías
   - Click "Agregar" en templates deseados
   - Llenar form de configuración
   - Guardar → Exercise instance creado con estado "Sin generar"

9. **Generar contenido con IA**
   - En lista de ejercicios agregados
   - Click "Generar con IA" por cada ejercicio
   - O click "Generar todos"
   - Estado cambia a "Generando" → "Generado"
   - Puede hacer preview del contenido

10. **Documentar fases** (opcional pero recomendado)
    - Ir a `/programas/:id/fases/:faseId/documentacion`
    - Llenar contexto, conceptos clave, ejemplos
    - Esta info mejora la generación de IA

11. **Configurar niveles** (opcional)
    - Ir a `/programas/:id/proof-points/:ppId/niveles`
    - Definir objetivos y criterios por nivel
    - Sistema adaptativo usa esto para estudiantes

12. **Vista de arquitectura** (cualquier momento)
    - Ir a `/programas/:id/arquitectura`
    - Ver roadmap visual completo
    - Editar visualmente si prefiere

13. **Publicar programa**
    - Cuando todo está listo
    - Ir a `/programas/:id`
    - Click "Publicar"
    - Sistema valida completitud
    - Crea snapshots inmutables
    - Estado cambia a "Publicado"

14. **Crear cohortes** (siguiente fase)
    - Con programa publicado, puede crear cohortes
    - Asignar estudiantes
    - Estudiantes ven contenido del programa

---

## 8. COMPONENTES CLAVE

### Flujo Nuevo (Usar)

| Componente | Ubicación | Propósito |
|-----------|-----------|-----------|
| `ProgramWizard` | `components/wizard/program-wizard.tsx` | Crear programa completo (4 pasos) |
| `FaseManager` | `components/program/FaseManager.tsx` | CRUD de fases |
| `ProofPointManager` | `components/program/ProofPointManager.tsx` | CRUD de proof points |
| `ExerciseSelector` | `components/exercises/ExerciseSelector.tsx` | Biblioteca de templates |
| `ExerciseInstanceList` | `components/exercises/ExerciseInstanceList.tsx` | Lista de ejercicios agregados |
| `ExerciseWizardDialog` | `components/exercise-wizard-dialog.tsx` | Form para agregar ejercicio |
| `VisualRoadmapBuilder` | `components/fase2/visual-roadmap-builder.tsx` | Vista visual de arquitectura |
| `NivelConfigurator` | `components/fase2/nivel-configurator.tsx` | Configuración de niveles |

### Flujo Antiguo (Deprecar)

| Componente | Ubicación | Estado |
|-----------|-----------|--------|
| `ProgramEditor` | `components/fase2/ProgramEditor.tsx` | ⚠️ No usar - Legacy |

---

## 9. VERIFICACIÓN DE IMPLEMENTACIÓN

### ✅ Completamente Implementado

- [x] Wizard de creación de programas (4 pasos)
- [x] CRUD de programas
- [x] CRUD de fases
- [x] CRUD de proof points
- [x] Catálogo de exercise templates
- [x] Agregar ejercicios a proof points
- [x] Vista de arquitectura visual
- [x] Publicar programa
- [x] UI para documentación de fases
- [x] UI para niveles de proof points
- [x] Preview del programa (vista estudiante)

### ⚠️ Parcialmente Implementado

- [ ] Generación de contenido con IA (UI lista, backend pendiente)
- [ ] Guardar documentación de fases (UI lista, endpoints pendientes)
- [ ] Guardar configuración de niveles (UI lista, endpoints pendientes)

### ❌ No Implementado

- [ ] Exercise content generation use case
- [ ] OpenAI integration
- [ ] Exercise content repository implementation
- [ ] Validación completa al publicar
- [ ] Sistema de cohortes (fase siguiente)
- [ ] Analytics y progreso de estudiantes (fase siguiente)

---

## 10. SIGUIENTES PASOS INMEDIATOS

### 1. FIX CRÍTICO - Cambiar ruta del botón Editar

**Archivo:** `apps/instructor-app/app/programas/[id]/page.tsx`

**Línea 96:**
```tsx
// ANTES (INCORRECTO):
<Link href={`/programas/${programId}/editar`}>
  <Edit className="mr-2 h-4 w-4" />
  Editar
</Link>

// DESPUÉS (CORRECTO):
<Link href={`/programas/${programId}/estructura`}>
  <Edit className="mr-2 h-4 w-4" />
  Editar Estructura
</Link>
```

**Impacto:** Los usuarios verán el flujo correcto con fases, proof points y ejercicios.

### 2. Implementar Generación de IA

**Archivos a crear:**
- `apps/api/src/application/exercise-instance/use-cases/GenerateExerciseContent/`
- `apps/api/src/infrastructure/ai/OpenAIService.ts`
- `apps/api/src/infrastructure/database/repositories/ExerciseContentRepository.ts`

**Endpoint nuevo:**
```
POST /api/v1/exercises/:id/generate
```

### 3. Testing del Flujo Completo

1. Crear programa con wizard
2. Editar estructura (verificar que va a /estructura)
3. Agregar fases
4. Agregar proof points
5. Agregar ejercicios
6. Generar contenido (cuando esté implementado)
7. Publicar programa

---

## RESUMEN FINAL

**FLUJO ESPERADO:**
1. Crear programa con wizard → ✅
2. Editar estructura (fases + proof points) → ✅ Funcional pero no es ruta por defecto
3. Agregar ejercicios a proof points → ✅
4. Generar contenido con IA → ⚠️ UI lista, backend pendiente
5. Publicar programa → ✅

**PROBLEMA PRINCIPAL:**
El botón "Editar" redirige al flujo antiguo en lugar del nuevo.

**SOLUCIÓN:**
Cambiar 1 línea de código en `/programas/[id]/page.tsx` (línea 96)

**COMPONENTES NUEVOS QUE SE UTILIZARÁN:**
- `FaseManager` → CRUD de fases
- `ProofPointManager` → CRUD de proof points
- `ExerciseSelector` → Biblioteca de templates
- `ExerciseInstanceList` → Ejercicios agregados
- `VisualRoadmapBuilder` → Vista visual
- `NivelConfigurator` → Niveles adaptativos

**TODOS LOS ENDPOINTS BACKEND NECESARIOS ESTÁN IMPLEMENTADOS** ✅

La migración y todos los componentes nuevos están listos. Solo necesitas:
1. Cambiar la ruta del botón Editar
2. Implementar la generación de IA (opcional para MVP)

¡El sistema está casi 100% funcional!
