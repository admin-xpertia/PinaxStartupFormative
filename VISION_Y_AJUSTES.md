# VISIÓN ORIGINAL DE XPERTIA - CLASSROOM POTENCIADO POR IA

## 🎯 VISIÓN DEL PRODUCTO

> "Transformar Xpertia en un Classroom potenciado por IA manteniendo la estructura pedagógica (Programa → Fase → Proof Point) pero simplificando dramáticamente la ejecución mediante una biblioteca de 10 tipos de ejercicios mediados por IA"

### Propuesta de Valor

**Para Instructores** = Google Classroom mejorado con IA
- Estructura pedagógica sólida (Programa → Fase → Proof Point)
- Biblioteca de 10 ejercicios mediados por IA
- Configuración contextual simple
- Preview antes de asignar
- Activación con 1 click

**Para Estudiantes** = Coursera potenciado por IA con tutor GPT-5
- Contenido personalizado por IA
- Tutor inteligente siempre disponible
- Progresión adaptativa
- Feedback inmediato

---

## 🚀 FLUJO SIMPLIFICADO ESPERADO

### Fase 1: Crear Programa ✅ IMPLEMENTADO

**Acción del Instructor:**
1. Click "Nuevo Programa"
2. Completar wizard 4 pasos:
   - Paso 1: Información básica
   - Paso 2: Definir fases
   - Paso 3: Definir proof points
   - Paso 4: Revisar y crear
3. Programa creado con estado: "Borrador"

**Resultado:**
- 1 Programa
- N Fases
- M Proof Points
- 0 Ejercicios (aún)

**Estado:** ✅ Completamente implementado

---

### Fase 2: Seleccionar y Adaptar Ejercicios ⚠️ PARCIAL

**Visión Original:**

> "Cuando ya se tiene creado el programa es poder ir seleccionando y adaptando los ejercicios, que los ejercicios sean intervenidos por IA"

**Flujo Esperado:**

1. Instructor abre programa creado
2. Ve lista de Fases y Proof Points
3. Para cada Proof Point:
   - Click "Agregar Ejercicios"
   - Ve **Biblioteca de 10 Categorías**
   - Selecciona ejercicios relevantes
   - Configura contexto para cada ejercicio
   - IA genera contenido personalizado
   - Preview del ejercicio generado
   - Si le gusta → Agregar al Proof Point

4. Repite para todos los Proof Points

**Componentes Necesarios:**

| Categoría | Icon | Propósito | IA Interviene |
|-----------|------|-----------|---------------|
| 📖 Lección Interactiva | Blue | Explicar conceptos con ejemplos | ✅ Genera lección adaptada |
| 📝 Cuaderno de Trabajo | Purple | Práctica guiada paso a paso | ✅ Genera ejercicios contextuales |
| 💬 Simulación de Interacción | Pink | Conversaciones simuladas | ✅ GPT-5 actúa como personaje |
| 🤖 Mentor y Asesor IA | Cyan | Tutor personal del estudiante | ✅ GPT-5 como mentor |
| 🔍 Herramienta de Análisis | Green | Analizar casos/datos | ✅ Analiza y da feedback |
| 🎨 Herramienta de Creación | Amber | Crear entregables | ✅ Asiste en creación |
| 📊 Sistema de Tracking | Blue | Seguimiento de progreso | ✅ Genera insights |
| ✅ Herramienta de Revisión | Teal | Revisar trabajo | ✅ Feedback automático |
| 🌐 Simulador de Entorno | Indigo | Simular escenarios reales | ✅ Genera escenarios |
| 🎯 Sistema de Progresión | Purple | Niveles adaptativos | ✅ Adapta dificultad |

**Estado Actual:**
- ✅ Biblioteca de 10 categorías implementada
- ✅ UI para seleccionar ejercicios
- ✅ Form de configuración contextual
- ⚠️ Generación con IA (UI lista, backend pendiente)
- ⚠️ Preview de ejercicios (UI parcial)

---

### Fase 3: Activar para Estudiantes ✅ IMPLEMENTADO

**Acción del Instructor:**
1. Cuando todos los Proof Points tienen ejercicios
2. Click "Publicar Programa"
3. Sistema valida completitud
4. Programa pasa a estado "Publicado"
5. Crear Cohorte y asignar estudiantes

**Resultado:**
- Estudiantes pueden acceder al programa
- Ven contenido generado por IA
- Interactúan con ejercicios
- Tutor GPT-5 los asiste

**Estado:** ✅ Backend implementado (falta cohortes)

---

## 📊 COMPARACIÓN: VISIÓN vs IMPLEMENTACIÓN ACTUAL

### ✅ LO QUE ESTÁ BIEN

| Aspecto | Visión | Implementado | Estado |
|---------|--------|--------------|--------|
| Estructura pedagógica | Programa → Fase → Proof Point | Sí | ✅ Correcto |
| Biblioteca de ejercicios | 10 categorías | 10 categorías | ✅ Correcto |
| Configuración contextual | Form de configuración | Form implementado | ✅ Correcto |
| Wizard de creación | Simple y guiado | 4 pasos | ✅ Correcto |
| Publicar programa | Activar con validación | POST /publish | ✅ Correcto |

### ⚠️ LO QUE NECESITA AJUSTE

| Aspecto | Visión | Implementado Actual | Ajuste Necesario |
|---------|--------|---------------------|------------------|
| Ruta después de crear programa | Ir directo a selección de ejercicios | Va a vista de detalle | Redirigir a `/estructura` o `/proof-points/:id/ejercicios` |
| Botón "Editar" | Seleccionar ejercicios | Va a flujo antiguo `/editar` | Cambiar a `/estructura` |
| Flujo de agregar ejercicios | Desde vista principal del programa | Requiere navegación profunda | Simplificar acceso |
| Generación con IA | Inmediata al agregar ejercicio | Botón manual | Puede quedarse así (más control) |
| Preview de ejercicios | Antes de agregar | Solo después de generar | Agregar preview de template |

### ❌ LO QUE FALTA IMPLEMENTAR

| Funcionalidad | Prioridad | Esfuerzo |
|---------------|-----------|----------|
| Generación de contenido con IA (backend) | 🔴 Alta | 3-5 días |
| Integración con OpenAI/GPT-5 | 🔴 Alta | 2-3 días |
| Preview de templates (antes de agregar) | 🟡 Media | 1-2 días |
| Sistema de cohortes | 🟢 Baja | 5-7 días (siguiente sprint) |
| Analytics de estudiantes | 🟢 Baja | 5-7 días (siguiente sprint) |

---

## 🎬 FLUJO IDEAL - PASO A PASO

### Escenario: Instructor crea "Road Map Startup"

#### **Paso 1: Crear Programa**

1. Login como instructor
2. Click "Nuevo Programa"
3. **Wizard Paso 1:** Información Básica
   ```
   Nombre: "Road Map Startup"
   Descripción: "Programa para founders de startups tech"
   Categoría: "Emprendimiento"
   Duración: 16 semanas
   Número de Fases: 4
   ```
4. **Wizard Paso 2:** Definir Fases
   ```
   Fase 1: "Pre-Semilla" (4 semanas)
     - Objetivos: ["Validar idea", "MVP técnico"]
     - Proof Points: 3

   Fase 2: "Semilla" (4 semanas)
     - Objetivos: ["Product-Market Fit", "Traction"]
     - Proof Points: 3

   Fase 3: "Serie A" (4 semanas)
     - Objetivos: ["Escalamiento", "Métricas"]
     - Proof Points: 3

   Fase 4: "Crecimiento" (4 semanas)
     - Objetivos: ["Expansión", "Operaciones"]
     - Proof Points: 3
   ```

5. **Wizard Paso 3:** Definir Proof Points
   ```
   Fase 1 - Pre-Semilla:
     PP1: "Identificar Problema"
       - Pregunta Central: "¿Qué problema estás resolviendo?"
       - Entregable: "Documento de problema"
       - Duración: 8 horas

     PP2: "Validar con Usuarios"
       - Pregunta Central: "¿Los usuarios pagarían por esto?"
       - Entregable: "Report de entrevistas"
       - Duración: 12 horas

     PP3: "Prototipo Técnico"
       - Pregunta Central: "¿Es técnicamente viable?"
       - Entregable: "Demo funcional"
       - Duración: 16 horas
   ```
   (Repite para Fases 2, 3, 4)

6. **Wizard Paso 4:** Revisar
   ```
   ✅ Programa: "Road Map Startup"
   ✅ 4 Fases
   ✅ 12 Proof Points
   ✅ 16 semanas total
   ✅ Estado: Borrador
   ```

7. Click "Crear Programa"

**Resultado Backend:**
```
POST /api/v1/programs → Crea programa:abc123
POST /api/v1/programs/abc123/fases → Crea fase:1, fase:2, fase:3, fase:4
POST /api/v1/fases/:id/proof-points → Crea 12 proof points
```

#### **Paso 2: Seleccionar Ejercicios** (LO MÁS IMPORTANTE)

**ACTUAL (Complejo):**
1. Programa creado → Redirige a `/programas/:id` (vista detalle)
2. Click "Editar" → Va a `/editar` (flujo antiguo) ❌
3. O navegar a "Arquitectura" → `/arquitectura`
4. O buscar link de "Estructura" (no visible fácilmente)
5. En estructura, seleccionar fase
6. Seleccionar proof point
7. Click link "Agregar Ejercicios"
8. Va a `/proof-points/:id/ejercicios`
9. Ahí recién ve la biblioteca

**IDEAL (Simple):**

1. Programa creado → Redirige directamente a **Vista de Estructura Simplificada**

**Vista Propuesta:**
```
┌──────────────────────────────────────────────────────────────────┐
│ Road Map Startup                                      [Publicar] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ▼ Fase 1: Pre-Semilla (4 semanas)                              │
│   ├─ 📍 PP1: Identificar Problema                    [+ Ejercicios] │
│   │   └─ 📖 Lección: "Cómo identificar problemas"              │
│   │   └─ 📝 Cuaderno: "Canvas de problema"                     │
│   │   └─ 🤖 Mentor: "Asistente de validación"                  │
│   │                                                              │
│   ├─ 📍 PP2: Validar con Usuarios                   [+ Ejercicios] │
│   │   └─ Sin ejercicios aún                                     │
│   │                                                              │
│   └─ 📍 PP3: Prototipo Técnico                      [+ Ejercicios] │
│       └─ Sin ejercicios aún                                     │
│                                                                  │
│ ▼ Fase 2: Semilla (4 semanas)                                  │
│   ├─ 📍 PP4: Product-Market Fit                     [+ Ejercicios] │
│   ...                                                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

2. Click "[+ Ejercicios]" en cualquier Proof Point
   - Se abre **Modal/Drawer de Biblioteca**

```
┌────────────────────────────────────────────┐
│ Biblioteca de Ejercicios                   │
│ Para: PP1 - Identificar Problema           │
├────────────────────────────────────────────┤
│ 🔍 Buscar ejercicios...                    │
├────────────────────────────────────────────┤
│                                            │
│ 📖 Lecciones Interactivas           [5]   │
│   ▫ Cómo identificar problemas       [+]  │
│   ▫ Mercados y oportunidades         [+]  │
│   ▫ Análisis de competencia          [+]  │
│                                            │
│ 📝 Cuadernos de Trabajo             [3]   │
│   ▫ Canvas de problema               [+]  │
│   ▫ Mapa de stakeholders             [+]  │
│                                            │
│ 💬 Simulaciones                      [2]   │
│   ▫ Entrevista con usuario           [+]  │
│   ▫ Pitch a inversionista            [+]  │
│                                            │
│ 🤖 Mentores IA                       [4]   │
│   ▫ Asistente de validación          [+]  │
│   ▫ Coach de pitch                   [+]  │
│                                            │
│ ... (6 categorías más)                    │
│                                            │
└────────────────────────────────────────────┘
```

3. Click [+] en un ejercicio
   - **Quick Preview** (nuevo)

```
┌────────────────────────────────────────────┐
│ Preview: Canvas de Problema                │
├────────────────────────────────────────────┤
│ Tipo: 📝 Cuaderno de Trabajo               │
│                                            │
│ Descripción:                               │
│ Guía al estudiante paso a paso para        │
│ documentar el problema que resolverá       │
│ su startup usando el framework Canvas.    │
│                                            │
│ Duración estimada: 45 minutos             │
│                                            │
│ Lo que incluye:                            │
│ ✓ Introducción al problema                │
│ ✓ Secciones del canvas                    │
│ ✓ Ejemplos de startups exitosas           │
│ ✓ Ejercicio práctico                      │
│ ✓ Revisión por IA                         │
│                                            │
│ [Cancelar]    [Agregar y Configurar →]    │
└────────────────────────────────────────────┘
```

4. Click "Agregar y Configurar"
   - **Form de Configuración Contextual**

```
┌────────────────────────────────────────────┐
│ Configurar Ejercicio                       │
├────────────────────────────────────────────┤
│ Nombre del ejercicio:                      │
│ [Canvas de Problema para tu Startup]      │
│                                            │
│ Contexto para la IA:                       │
│ ┌─────────────────────────────────────┐   │
│ │ Este ejercicio es para founders de  │   │
│ │ startups tech en etapa pre-semilla. │   │
│ │ Enfócate en problemas B2B SaaS.    │   │
│ └─────────────────────────────────────┘   │
│                                            │
│ Configuración específica:                  │
│                                            │
│ Lenguaje: [Español ▼]                     │
│ Nivel de detalle: [●●●○○] Intermedio     │
│ Incluir ejemplos: [✓]                     │
│ Permitir revisiones: [✓]                  │
│                                            │
│ Duración estimada: [45] minutos           │
│ ¿Es obligatorio?: [✓] Sí  [ ] No         │
│                                            │
│ [Cancelar]  [Guardar]  [Guardar y Generar→]│
└────────────────────────────────────────────┘
```

5. Click "Guardar y Generar"
   - Backend crea Exercise Instance
   - IA genera contenido inmediatamente
   - Loading spinner: "Generando contenido con IA..."
   - Cuando termina: Ejercicio agregado a la lista

6. Repite para todos los Proof Points que necesite

#### **Paso 3: Activar para Estudiantes**

1. Cuando el programa tiene suficientes ejercicios
2. Click "Publicar" (botón siempre visible arriba)
3. Sistema valida:
   ```
   ✓ Todas las fases tienen proof points
   ✓ Todos los proof points tienen al menos 1 ejercicio
   ✓ Contenido generado está listo
   ```
4. Si pasa validación:
   ```
   Estado: Borrador → Publicado
   Snapshots creados (inmutables)
   ```
5. Crear Cohorte:
   - Nombre: "Batch Enero 2025"
   - Fecha inicio: 15 Enero 2025
   - Asignar estudiantes

6. Estudiantes reciben acceso

---

## 🔧 AJUSTES NECESARIOS

### 1. Cambiar Flujo Post-Creación de Programa

**Archivo:** `apps/instructor-app/components/wizard/program-wizard.tsx`

**Buscar:** Después de crear programa exitosamente

**Cambio:**
```typescript
// ANTES:
router.push(`/programas/${newProgramId}`) // Vista de detalle

// DESPUÉS:
router.push(`/programas/${newProgramId}/estructura`) // Vista de estructura
```

**Impacto:** Instructor va directo a agregar ejercicios

---

### 2. Cambiar Botón "Editar"

**Archivo:** `apps/instructor-app/app/programas/[id]/page.tsx`

**Línea:** 96

**Cambio:**
```tsx
// ANTES:
<Link href={`/programas/${programId}/editar`}>
  <Edit className="mr-2 h-4 w-4" />
  Editar
</Link>

// DESPUÉS:
<Link href={`/programas/${programId}/estructura`}>
  <Edit className="mr-2 h-4 w-4" />
  Editar Estructura
</Link>
```

**Impacto:** Usa flujo nuevo en vez de antiguo

---

### 3. Simplificar Vista de Estructura

**Archivo:** `apps/instructor-app/app/programas/[id]/estructura/page.tsx`

**Objetivo:** Vista más simple tipo accordion/tree

**Propuesta Nueva:**

```tsx
// Vista simplificada tipo árbol expandible
<div className="space-y-4">
  {fases.map((fase) => (
    <Accordion key={fase.id}>
      <AccordionItem>
        <AccordionTrigger>
          <div className="flex items-center justify-between w-full">
            <span>Fase {fase.numeroFase}: {fase.nombre}</span>
            <Badge>{fase.proofPoints?.length || 0} proof points</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pl-6">
            {fase.proofPoints?.map((pp) => (
              <Card key={pp.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{pp.nombre}</h4>
                    <p className="text-sm text-muted-foreground">
                      {pp.exercises?.length || 0} ejercicios
                    </p>
                  </div>
                  <Button
                    onClick={() => openExerciseLibrary(pp.id)}
                    variant="outline"
                    size="sm"
                  >
                    + Ejercicios
                  </Button>
                </div>

                {/* Lista de ejercicios agregados */}
                {pp.exercises?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {pp.exercises.map((ex) => (
                      <div className="flex items-center gap-2 text-sm">
                        <span>{ex.template.icono}</span>
                        <span>{ex.nombre}</span>
                        <Badge variant={ex.estadoContenido === 'generado' ? 'success' : 'secondary'}>
                          {ex.estadoContenido}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ))}
</div>
```

---

### 4. Implementar Biblioteca Modal/Drawer

**Archivo:** Nuevo componente `components/exercises/ExerciseLibraryDrawer.tsx`

**Propósito:** Modal/Drawer que se abre al hacer click "+ Ejercicios"

**Features:**
- Buscar ejercicios por nombre
- Filtrar por categoría
- Ver info rápida de cada template
- Preview antes de agregar
- Agregar con configuración

---

### 5. Mejorar Preview de Templates

**Archivo:** `components/exercises/ExercisePreviewDialog.tsx`

**Agregar:**
- Preview de estructura del ejercicio
- Ejemplos de contenido que generará la IA
- Estimación de duración
- Qué incluye el ejercicio
- Preview visual (mockup)

---

### 6. Implementar Generación con IA (Backend)

**Archivos nuevos:**

1. **Use Case:** `apps/api/src/application/exercise-instance/use-cases/GenerateExerciseContent/`
2. **Service:** `apps/api/src/infrastructure/ai/OpenAIService.ts`
3. **Repository:** `apps/api/src/infrastructure/database/repositories/ExerciseContentRepository.ts`

**Endpoint:**
```
POST /api/v1/exercises/:id/generate

Request:
{
  "forceRegenerate": false
}

Response:
{
  "exerciseId": "exercise_instance:abc123",
  "contentId": "exercise_content:xyz789",
  "status": "generado",
  "generatedAt": "2025-01-15T10:00:00Z"
}
```

**Flujo:**
1. Recibe exercise instance ID
2. Obtiene template del ejercicio
3. Obtiene configuración personalizada
4. Obtiene contexto del proof point
5. Obtiene documentación de la fase
6. Construye prompt para GPT-5
7. Llama a OpenAI API
8. Parsea respuesta
9. Valida contra output_schema del template
10. Guarda en exercise_content
11. Actualiza estado del instance

---

### 7. Integración con GPT-5

**Service:** `OpenAIService.ts`

```typescript
interface GenerateContentRequest {
  template: ExerciseTemplate
  configuration: Record<string, any>
  context: {
    programName: string
    faseName: string
    faseDescription: string
    proofPointName: string
    proofPointQuestion: string
    faseDocumentation?: FaseDocumentation
  }
}

class OpenAIService {
  async generateExerciseContent(request: GenerateContentRequest) {
    // Construir prompt usando template.promptTemplate
    const prompt = this.buildPrompt(request)

    // Llamar a GPT-5
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: "Eres un diseñador instruccional experto..." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    // Parsear y validar
    const content = JSON.parse(response.choices[0].message.content)
    this.validateAgainstSchema(content, request.template.outputSchema)

    return content
  }
}
```

---

## 📈 PRIORIDADES DE IMPLEMENTACIÓN

### Sprint 1 - MVP Funcional (2 semanas)

**Objetivo:** Flujo completo de instructor funcional

1. **Fix de Rutas** (1 día) 🔴 CRÍTICO
   - Cambiar redirección post-creación
   - Cambiar botón "Editar"
   - Actualizar breadcrumbs

2. **Simplificar Vista de Estructura** (2-3 días) 🔴 CRÍTICO
   - Rediseñar página `/estructura`
   - Vista tipo accordion/tree
   - Botones "+ Ejercicios" visibles

3. **Biblioteca Modal/Drawer** (2-3 días) 🟡 ALTA
   - Crear componente ExerciseLibraryDrawer
   - Integrar con botones "+ Ejercicios"
   - Buscar y filtrar ejercicios

4. **Preview Mejorado** (2 días) 🟡 ALTA
   - Mejorar ExercisePreviewDialog
   - Mostrar ejemplos de contenido
   - Preview visual

5. **Generación con IA - Backend** (3-5 días) 🔴 CRÍTICO
   - Use Case GenerateExerciseContent
   - OpenAIService con GPT-5
   - ExerciseContentRepository
   - Endpoint POST /exercises/:id/generate

6. **Testing del Flujo Completo** (2 días)
   - Test E2E del flujo instructor
   - Fix bugs encontrados

### Sprint 2 - Experiencia de Estudiante (2 semanas)

1. **Sistema de Cohortes** (5 días)
   - CRUD de cohortes
   - Asignar estudiantes
   - Snapshots de programas

2. **Vista de Estudiante** (5 días)
   - Acceso a programa asignado
   - Renderizar ejercicios
   - Tracking de progreso

3. **Tutor GPT-5 para Estudiantes** (3-4 días)
   - Chat con IA en cada ejercicio
   - Contexto del estudiante
   - Feedback personalizado

### Sprint 3 - Analytics y Mejoras (1 semana)

1. **Analytics para Instructor**
   - Progreso de cohorte
   - Insights por estudiante
   - Puntos de fricción

2. **Mejoras de UX**
   - Drag and drop
   - Inline editing
   - Shortcuts de teclado

---

## ✅ CHECKLIST DE AJUSTES INMEDIATOS

### Para que funcione como la visión original:

- [ ] **Cambiar ruta post-creación de programa**
  - Archivo: `components/wizard/program-wizard.tsx`
  - Cambio: Redirigir a `/estructura` en vez de `/` detalle

- [ ] **Cambiar botón "Editar"**
  - Archivo: `app/programas/[id]/page.tsx:96`
  - Cambio: Link a `/estructura` en vez de `/editar`

- [ ] **Simplificar página de estructura**
  - Archivo: `app/programas/[id]/estructura/page.tsx`
  - Cambio: Layout más simple tipo accordion

- [ ] **Crear ExerciseLibraryDrawer**
  - Archivo nuevo: `components/exercises/ExerciseLibraryDrawer.tsx`
  - Integrar con botones "+ Ejercicios"

- [ ] **Mejorar preview de templates**
  - Archivo: `components/exercises/ExercisePreviewDialog.tsx`
  - Agregar ejemplos visuales

- [ ] **Implementar generación con IA**
  - Archivos nuevos en `apps/api/src/`
  - Endpoint POST /exercises/:id/generate

- [ ] **Testing**
  - Probar flujo completo de creación
  - Probar selección de ejercicios
  - Probar generación con IA
  - Probar publicación

---

## 🎓 RESULTADO ESPERADO

### Flujo Instructor (5 minutos para crear programa completo)

1. Click "Nuevo Programa" → Wizard 4 pasos → Click "Crear"
2. Se abre vista de estructura
3. Ve árbol de Fases > Proof Points
4. Para cada PP: Click "+ Ejercicios"
5. Modal abre biblioteca
6. Selecciona 2-3 ejercicios por PP
7. Configura contexto
8. Click "Guardar y Generar"
9. IA genera en <30 segundos
10. Repite para todos los PPs
11. Click "Publicar"
12. Crea cohorte y asigna estudiantes
13. ✅ Estudiantes tienen acceso

### Experiencia Estudiante

1. Login → Ve programa asignado
2. Ve Fase 1 > PP1
3. Ve lista de ejercicios:
   - 📖 Lección: "Cómo identificar problemas"
   - 📝 Cuaderno: "Canvas de problema"
   - 🤖 Mentor: Tutor personal
4. Empieza lección → IA presenta contenido personalizado
5. Hace preguntas al tutor GPT-5
6. Completa cuaderno con asistencia de IA
7. Recibe feedback instantáneo
8. Progresa al siguiente PP
9. Sistema adapta dificultad según desempeño

---

## 🚀 PRÓXIMOS PASOS

### Hoy:

1. **Fix crítico de rutas** (30 minutos)
   - Cambiar 2 líneas de código
   - Probar que flujo funciona

### Esta semana:

2. **Simplificar estructura** (2-3 días)
3. **Biblioteca modal** (2-3 días)

### Próxima semana:

4. **Generación IA** (3-5 días)
5. **Testing** (2 días)

### Resultado:
- ✅ MVP completo funcional
- ✅ Instructor puede crear programas en 5 min
- ✅ Ejercicios generados por IA
- ✅ Preview antes de agregar
- ✅ Listo para cohortes

---

## 🎯 RESUMEN FINAL

**VISIÓN:**
"Classroom potenciado por IA + Coursera con tutor GPT-5"

**ESTADO:**
- ✅ 80% implementado
- ⚠️ 15% necesita ajustes
- ❌ 5% falta IA

**PARA LOGRARLO:**
1. Cambiar 2 rutas (30 min)
2. Simplificar UI (2-3 días)
3. Implementar IA (3-5 días)

**TOTAL:** ~1 semana de trabajo

**¿Qué hacemos ahora?** 🚀

¿Quieres que haga el fix crítico de las rutas primero? Es solo cambiar 2 líneas de código y ya tendrás el flujo correcto funcionando.
