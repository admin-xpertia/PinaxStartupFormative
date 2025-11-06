# Dominio de Ejercicios

Este dominio gestiona el nuevo sistema de ejercicios mediados por IA basado en templates flexibles.

## Arquitectura Simplificada

### Antes (Complejo):
```
Programa → Fase → ProofPoint → Nivel → Componente (4 tipos rígidos)
```

### Ahora (Simplificado):
```
Programa → Fase → ProofPoint → Exercise Instance (10 tipos flexibles basados en templates)
```

## Componentes

### 1. ExerciseTemplate
**Tabla**: `exercise_template`

Catálogo de 10 tipos de ejercicios mediados por IA:
1. **Lección Interactiva** - Contenido activo con quizzes
2. **Cuaderno de Trabajo** - Reflexión guiada y documentación
3. **Simulación de Interacción** - Conversaciones con personajes IA
4. **Mentor y Asesor IA** - Guidance socrático experto
5. **Herramienta de Análisis** - Evaluación estructurada
6. **Herramienta de Creación** - Asistente generativo
7. **Sistema de Tracking** - Monitoreo de progreso
8. **Herramienta de Revisión** - Feedback formativo
9. **Simulador de Entorno** - Experimentación segura
10. **Sistema de Progresión** - Evaluación de dominio

Cada template incluye:
- `configuracion_schema`: Define qué parámetros son configurables
- `configuracion_default`: Valores por defecto
- `prompt_template`: Template con placeholders para generación IA
- `output_schema`: Estructura esperada del contenido generado
- `preview_config`: Datos para mostrar preview en UI

### 2. ExerciseInstance
**Tabla**: `exercise_instance`

Instancia de un template aplicada a un proof point específico:
- Link al `exercise_template` y `proof_point`
- `consideraciones_contexto`: Texto markdown del instructor
- `configuracion_personalizada`: Override de defaults del template
- `estado_contenido`: sin_generar | generando | draft | publicado
- `contenido_actual`: Link al contenido generado

### 3. ExerciseContent
**Tabla**: `exercise_content`

Contenido generado por IA para una instancia:
- `contenido`: Objeto JSON según output_schema del template
- `estado`: draft | publicado
- `version`: Para historial

### 4. ExerciseProgress
**Tabla**: `exercise_progress`

Progreso del estudiante (simplificado vs sistema anterior):
- Un solo nivel de tracking (vs 3 niveles antes)
- Estado, porcentaje, fechas, score
- Link a datos del estudiante

## Servicios

### ExerciseTemplatesService

**Responsabilidades:**
- Obtener catálogo de templates
- Validar configuraciones personalizadas
- Mergear configuración default + personalizada
- Interpolar variables en prompt templates

**Métodos principales:**
```typescript
getAllTemplates(filtros?: GetTemplatesFilters): Promise<ExerciseTemplate[]>
getTemplateById(templateId: string): Promise<ExerciseTemplate>
getTemplatesGroupedByCategory(): Promise<Record<ExerciseCategory, ExerciseTemplate[]>>
validateConfiguration(template, configuracion): { valid: boolean, errors: string[] }
interpolatePromptTemplate(template, context): string
```

### ExerciseInstancesService

**Responsabilidades:**
- CRUD de instancias de ejercicios
- Reordenamiento
- Duplicación
- Gestión de estado de contenido

**Métodos principales:**
```typescript
createInstance(dto: CreateExerciseInstanceDto): Promise<ExerciseInstance>
getInstancesByProofPoint(proofPointId: string): Promise<ExerciseInstance[]>
getInstanceById(instanceId: string): Promise<ExerciseInstance>
updateInstance(instanceId, dto: UpdateExerciseInstanceDto): Promise<ExerciseInstance>
deleteInstance(instanceId: string): Promise<void>
reorderInstances(proofPointId, ordenamiento): Promise<void>
duplicateInstance(instanceId: string): Promise<ExerciseInstance>
getInstanceContent(instanceId: string): Promise<ExerciseContent | null>
```

## API Endpoints

### Templates

```
GET    /exercise-templates
       Query: ?categoria=leccion_interactiva&esOficial=true&activo=true

GET    /exercise-templates/grouped

GET    /exercise-templates/:id
```

### Instances

```
POST   /exercise-instances
       Body: CreateExerciseInstanceDto

GET    /exercise-instances/proof-point/:proofPointId

GET    /exercise-instances/:id

GET    /exercise-instances/:id/content

PUT    /exercise-instances/:id
       Body: UpdateExerciseInstanceDto

DELETE /exercise-instances/:id

POST   /exercise-instances/proof-point/:proofPointId/reorder
       Body: { ordenamiento: [{ instanceId, orden }] }

POST   /exercise-instances/:id/duplicate
```

## Flujo de Uso

### Para el Instructor

1. **Crear programa/fase/proof point** (como siempre)

2. **Abrir biblioteca de ejercicios** para un proof point:
   ```
   GET /exercise-templates/grouped
   ```

3. **Agregar contexto al proof point** (opcional):
   ```markdown
   # Customer Startup Fit

   En este proof point, enfatizar la diferencia entre
   validación y verificación...
   ```

4. **Seleccionar ejercicio de la biblioteca**:
   - Ver preview del ejercicio
   - Configurar parámetros (duración, profundidad, etc.)
   - Agregar consideraciones específicas

5. **Crear instancia**:
   ```
   POST /exercise-instances
   {
     templateId: "exercise_template:leccion_interactiva",
     proofPointId: "proof_point:csf",
     nombre: "Metodologías de Validación",
     consideracionesContexto: "Incluir ejemplos de Airbnb",
     configuracionPersonalizada: {
       duracion_minutos: 25,
       profundidad: "avanzada",
       incluir_quizzes: true
     }
   }
   ```

6. **Generar contenido con IA** (ver generacion.service.ts):
   - Sistema construye prompt usando:
     - Template prompt
     - Documentación de fase
     - Contexto del proof point
     - Consideraciones del instructor
     - Configuración personalizada
   - IA genera contenido
   - Se crea `exercise_content`

7. **Revisar y publicar**:
   - Instructor revisa contenido generado
   - Puede editar manualmente
   - Marca como "publicado"

8. **Crear cohorte**:
   - Sistema hace copia del programa (copy-on-cohort)
   - Estudiantes ven versión inmutable

### Para el Estudiante

1. **Ver proof points disponibles**

2. **Entrar a proof point** → Ver lista de ejercicios

3. **Completar ejercicio**:
   - Cada tipo tiene su "player" React específico
   - Interactúa con contenido
   - Sistema guarda progreso en `exercise_progress`

4. **Desbloquear siguiente proof point** cuando completa suficientes ejercicios

## Variables de Contexto para Prompts

El sistema reemplaza estas variables en los prompt templates:

```
{{programa.nombre}}
{{programa.descripcion}}
{{fase.nombre}}
{{fase.descripcion}}
{{fase.numero_fase}}
{{proof_point.nombre}}
{{proof_point.pregunta_central}}
{{proof_point.documentacion_contexto}}
{{fase_documentation}}  // JSON completo
{{consideraciones}}     // Del instructor
{{configuracion.campo}} // Cada campo de configuración
{{contexto_completo}}   // Todo el contexto formateado
{{output_schema}}       // Schema esperado
```

## Migraciones Pendientes

- [ ] Eliminar tabla `nivel`
- [ ] Eliminar tabla `prerequisitos_componente`
- [ ] Eliminar 7 tablas `snapshot_*`
- [ ] Script de migración de datos existentes

## TODOs

- [ ] Implementar generación batch (todos los ejercicios de un proof point)
- [ ] Cache de contenidos generados
- [ ] Sistema de versiones de contenido
- [ ] Feedback del instructor sobre calidad de generación
- [ ] Analytics de qué tipos de ejercicios funcionan mejor
- [ ] Exportación de ejercicios a otros formatos
