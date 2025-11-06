# Xpertia Platform - Domain-Driven Design Architecture

## Executive Summary

This document defines the complete Domain-Driven Design (DDD) architecture for the Xpertia Classroom platform. The refactoring aims to:

1. **Simplify**: Reduce from 60+ database tables to ~20 essential tables
2. **Decouple**: Separate concerns into clear bounded contexts and layers
3. **Maintainability**: Create flexible, reusable components following SOLID principles
4. **Scalability**: Enable future growth without "god components"

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Next.js    │  │   REST API   │  │   GraphQL    │         │
│  │  Components  │  │ Controllers  │  │  (Future)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Use Cases   │  │     DTOs     │  │   Mappers    │         │
│  │ (Orchestrate)│  │ (Transfer)   │  │ (Transform)  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Entities   │  │Value Objects │  │  Aggregates  │         │
│  │   (Core)     │  │  (Immutable) │  │   (Roots)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │Domain Events │  │Domain Services│                           │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Repositories │  │   SurrealDB  │  │  OpenAI API  │         │
│  │(Data Access) │  │   Adapter    │  │   Adapter    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Bounded Contexts

### 1. **Program Design Context** (Diseño de Programas)
**Responsibility**: Educational program structure and content authoring

**Entities**:
- `Programa` (Aggregate Root)
- `Fase`
- `ProofPoint`
- `FaseDocumentation`

**Value Objects**:
- `ProgramMetadata` (categoria, nivel, tags)
- `ProofPointSlug`
- `Duration` (weeks, hours)

**Domain Services**:
- `ProgramValidator` - Validates program structure integrity
- `PrerequisiteResolver` - Resolves proof point dependencies

**Events**:
- `ProgramPublished`
- `ProofPointAdded`
- `PhaseOrderChanged`

---

### 2. **Exercise Catalog Context** (Catálogo de Ejercicios)
**Responsibility**: Exercise template management and library

**Entities**:
- `ExerciseTemplate` (Aggregate Root)
- `ExerciseCategory` (Enum/Value Object)

**Value Objects**:
- `ConfigurationSchema`
- `PromptTemplate`
- `OutputSchema`

**Domain Services**:
- `ConfigurationValidator` - Validates exercise configurations
- `TemplateInterpolator` - Interpolates prompt templates

**Events**:
- `TemplateCreated`
- `TemplateUpdated`

---

### 3. **Exercise Instance Context** (Instancias de Ejercicios)
**Responsibility**: Exercise instances applied to proof points

**Entities**:
- `ExerciseInstance` (Aggregate Root)
- `ExerciseContent`

**Value Objects**:
- `ExerciseConfiguration`
- `ExerciseOrder`

**Domain Services**:
- `ContentGenerator` - Generates exercise content with AI
- `ContextBuilder` - Builds generation context

**Events**:
- `ExerciseAdded`
- `ContentGenerated`
- `ExercisePublished`

---

### 4. **Cohort Management Context** (Gestión de Cohortes)
**Responsibility**: Cohort creation and student enrollment

**Entities**:
- `Cohorte` (Aggregate Root)
- `Inscripcion`

**Value Objects**:
- `DateRange` (fecha_inicio, fecha_fin)
- `CohortStatus` (activo, pausado, completado)

**Domain Services**:
- `ProgramSnapshotter` - Creates program snapshots (copy-on-cohort)
- `EnrollmentManager` - Manages student enrollments

**Events**:
- `CohortCreated`
- `StudentEnrolled`
- `CohortActivated`

---

### 5. **Student Progress Context** (Progreso de Estudiantes)
**Responsibility**: Track student progress through exercises and proof points

**Entities**:
- `ProofPointProgress` (Aggregate Root)
- `ExerciseProgress`
- `StudentData`

**Value Objects**:
- `ProgressStatus` (no_iniciado, en_progreso, completado)
- `Score` (0-100)

**Domain Services**:
- `ProgressCalculator` - Calculates completion percentages
- `PrerequisiteChecker` - Checks if proof points are unlocked

**Events**:
- `ExerciseStarted`
- `ExerciseCompleted`
- `ProofPointUnlocked`

---

### 6. **AI Generation Context** (Generación con IA)
**Responsibility**: AI content generation orchestration

**Entities**:
- `GenerationRequest` (Aggregate Root)
- `GeneratedContent`

**Value Objects**:
- `GenerationStatus` (pending, processing, completed, failed)
- `TokenUsage`

**Domain Services**:
- `OpenAIClient` - Communicates with OpenAI API
- `PromptBuilder` - Builds prompts from templates and context

**Events**:
- `GenerationRequested`
- `GenerationCompleted`
- `GenerationFailed`

---

### 7. **User & Auth Context** (Usuarios y Autenticación)
**Responsibility**: User management and authentication

**Entities**:
- `User` (Aggregate Root)
- `Session`
- `Estudiante` (extends User)

**Value Objects**:
- `Email`
- `UserRole` (admin, instructor, estudiante)

**Domain Services**:
- `PasswordHasher` - Hashes passwords with Argon2
- `TokenGenerator` - Generates JWT tokens

**Events**:
- `UserRegistered`
- `UserLoggedIn`

---

## Simplified Database Schema

### **KEEP (Core Tables - 15)**

```sql
-- PROGRAM DESIGN CONTEXT
programa
fase
proof_point
prerequisitos_proof_point
fase_documentation

-- EXERCISE CONTEXT
exercise_template
exercise_instance
exercise_content

-- COHORT CONTEXT
cohorte
inscripcion_cohorte

-- PROGRESS CONTEXT
progreso_proof_point
exercise_progress
datos_estudiante

-- USER CONTEXT
user
estudiante
```

### **REMOVE (Deprecated/Simplified - 45+)**

```sql
-- Legacy 4-level hierarchy
❌ nivel
❌ componente
❌ componente_contenido
❌ progreso_nivel
❌ progreso_componente
❌ prerequisitos_componente

-- Complex versioning (simplified to copy-on-cohort)
❌ version_contenido
❌ cambio_contenido
❌ comparacion_version
❌ rollback_historia
❌ aprobacion_version
❌ conflicto_version

-- Deferred to Phase 2 (portfolio system)
❌ portafolio
❌ reporte_integral
❌ artefacto
❌ shared_portfolio_link
❌ vista_portafolio
❌ badge
❌ estudiante_badge

-- Analytics (simplified)
❌ validacion_calidad
❌ metricas_componente (aggregate on-the-fly)
```

### **SIMPLIFY (Modified - 5)**

```sql
-- Snapshot system: Just copy the entire program on cohort creation
snapshot_programa (simplified: store full JSON snapshot)

-- Evaluation (integrate into exercise_progress)
✓ evaluacion_resultado → merged into exercise_progress

-- Feedback (integrate into exercise_progress)
✓ feedback_generado → merged into exercise_progress

-- Generation (support both old and new)
✓ generacion_request (updated to support exercise_instance)
✓ contenido_generado (simplified)
```

**Total: ~20 tables** (from 60+)

---

## Layer Structure

### **1. Domain Layer** (`apps/api/src/domain/`)

```
domain/
├── program-design/
│   ├── entities/
│   │   ├── Programa.ts
│   │   ├── Fase.ts
│   │   └── ProofPoint.ts
│   ├── value-objects/
│   │   ├── ProgramMetadata.ts
│   │   ├── Duration.ts
│   │   └── ProofPointSlug.ts
│   ├── services/
│   │   ├── ProgramValidator.ts
│   │   └── PrerequisiteResolver.ts
│   ├── events/
│   │   └── ProgramPublished.ts
│   └── repositories/
│       └── IProgramRepository.ts (interface)
│
├── exercise-catalog/
│   ├── entities/
│   │   └── ExerciseTemplate.ts
│   ├── value-objects/
│   │   ├── ConfigurationSchema.ts
│   │   └── ExerciseCategory.ts
│   ├── services/
│   │   ├── ConfigurationValidator.ts
│   │   └── TemplateInterpolator.ts
│   └── repositories/
│       └── IExerciseTemplateRepository.ts
│
├── exercise-instance/
│   ├── entities/
│   │   ├── ExerciseInstance.ts
│   │   └── ExerciseContent.ts
│   ├── aggregates/
│   │   └── ExerciseInstanceAggregate.ts
│   ├── services/
│   │   ├── ContentGenerator.ts
│   │   └── ContextBuilder.ts
│   └── repositories/
│       └── IExerciseInstanceRepository.ts
│
├── cohort/
│   ├── entities/
│   │   ├── Cohorte.ts
│   │   └── Inscripcion.ts
│   ├── value-objects/
│   │   ├── DateRange.ts
│   │   └── CohortStatus.ts
│   ├── services/
│   │   ├── ProgramSnapshotter.ts
│   │   └── EnrollmentManager.ts
│   └── repositories/
│       └── ICohortRepository.ts
│
├── student-progress/
│   ├── entities/
│   │   ├── ProofPointProgress.ts
│   │   ├── ExerciseProgress.ts
│   │   └── StudentData.ts
│   ├── services/
│   │   ├── ProgressCalculator.ts
│   │   └── PrerequisiteChecker.ts
│   └── repositories/
│       └── IProgressRepository.ts
│
└── shared/
    ├── value-objects/
    │   ├── RecordId.ts
    │   └── Timestamp.ts
    └── events/
        └── DomainEvent.ts
```

### **2. Application Layer** (`apps/api/src/application/`)

```
application/
├── program-design/
│   ├── use-cases/
│   │   ├── CreateProgram/
│   │   │   ├── CreateProgramUseCase.ts
│   │   │   ├── CreateProgramDTO.ts
│   │   │   └── CreateProgramMapper.ts
│   │   ├── AddProofPoint/
│   │   │   ├── AddProofPointUseCase.ts
│   │   │   └── AddProofPointDTO.ts
│   │   └── PublishProgram/
│   │       └── PublishProgramUseCase.ts
│   └── queries/
│       ├── GetProgramDetails/
│       └── ListPrograms/
│
├── exercise-catalog/
│   ├── use-cases/
│   │   ├── GetTemplateLibrary/
│   │   ├── ValidateConfiguration/
│   │   └── PreviewExercise/
│   └── queries/
│       └── GetTemplatesGrouped/
│
├── exercise-instance/
│   ├── use-cases/
│   │   ├── AddExerciseToProofPoint/
│   │   │   ├── AddExerciseUseCase.ts
│   │   │   └── AddExerciseDTO.ts
│   │   ├── GenerateExerciseContent/
│   │   └── PublishExercise/
│   └── queries/
│       └── GetExercisesByProofPoint/
│
├── cohort/
│   ├── use-cases/
│   │   ├── CreateCohort/
│   │   ├── EnrollStudent/
│   │   └── ActivateCohort/
│   └── queries/
│       └── GetCohortDetails/
│
├── student-progress/
│   ├── use-cases/
│   │   ├── StartExercise/
│   │   ├── CompleteExercise/
│   │   ├── SaveStudentData/
│   │   └── UnlockProofPoint/
│   └── queries/
│       ├── GetStudentProgress/
│       └── GetDashboardStats/
│
└── shared/
    ├── interfaces/
    │   ├── IUseCase.ts
    │   └── IQuery.ts
    └── types/
        └── Result.ts
```

### **3. Infrastructure Layer** (`apps/api/src/infrastructure/`)

```
infrastructure/
├── database/
│   ├── surrealdb/
│   │   ├── SurrealDBAdapter.ts
│   │   └── SurrealDBConnection.ts
│   └── repositories/
│       ├── ProgramRepository.ts
│       ├── ExerciseTemplateRepository.ts
│       ├── ExerciseInstanceRepository.ts
│       ├── CohortRepository.ts
│       └── ProgressRepository.ts
│
├── ai/
│   ├── OpenAIClient.ts
│   └── PromptBuilder.ts
│
├── events/
│   ├── EventBus.ts
│   └── EventHandlers.ts
│
└── mappers/
    ├── ProgramMapper.ts
    ├── ExerciseMapper.ts
    └── ProgressMapper.ts
```

### **4. Presentation Layer** (`apps/api/src/presentation/`)

```
presentation/
├── controllers/
│   ├── ProgramController.ts
│   ├── ExerciseController.ts
│   ├── CohortController.ts
│   └── ProgressController.ts
│
├── dto/
│   ├── requests/
│   └── responses/
│
└── middleware/
    ├── AuthMiddleware.ts
    └── ValidationMiddleware.ts
```

---

## Frontend Architecture (Atomic Design)

### **Component Hierarchy**

```
components/
├── atoms/                      # Basic building blocks
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.types.ts
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Badge/
│   ├── Card/
│   └── Icon/
│
├── molecules/                  # Simple component combinations
│   ├── ExerciseCard/
│   │   ├── ExerciseCard.tsx
│   │   ├── ExerciseCard.types.ts
│   │   └── index.ts
│   ├── ProofPointHeader/
│   ├── ProgressBar/
│   ├── TemplatePreview/
│   └── ConfigField/
│
├── organisms/                  # Complex UI sections
│   ├── ExerciseLibrary/
│   │   ├── ExerciseLibrary.tsx
│   │   ├── ExerciseLibrary.types.ts
│   │   ├── useExerciseLibrary.ts
│   │   └── index.ts
│   ├── ExerciseWizard/
│   ├── ProgramEditor/
│   ├── ProgressDashboard/
│   └── StudentDashboard/
│
├── templates/                  # Page layouts
│   ├── InstructorLayout/
│   ├── StudentLayout/
│   └── EditorLayout/
│
└── pages/                      # Next.js pages (thin wrappers)
    └── programas/
        └── [id]/
            └── proof-points/
                └── [ppId]/
                    └── ejercicios/
                        └── page.tsx
```

### **Component Design Principles**

1. **Single Responsibility**: Each component does ONE thing
2. **Composition over Inheritance**: Build complex UIs from simple components
3. **Dependency Injection**: Pass dependencies as props
4. **Controlled Components**: State managed by parents
5. **Type Safety**: Full TypeScript coverage
6. **Testability**: Every component has tests

---

## Exercise System Architecture

### **10 Exercise Types (Templates)**

1. **Lección Interactiva** - Interactive lessons with quizzes
2. **Cuaderno de Trabajo** - Guided reflection workbook
3. **Simulación de Interacción** - Conversational simulations
4. **Mentor/Asesor IA** - Socratic AI mentor
5. **Herramienta de Análisis** - Structured analysis tool
6. **Herramienta de Creación** - AI-assisted creation
7. **Sistema de Tracking** - Progress monitoring
8. **Herramienta de Revisión** - Formative feedback tool
9. **Simulador de Entorno** - Environment experimentation
10. **Sistema de Progresión** - Mastery evaluation

### **Exercise Flow**

```
Instructor Flow:
┌──────────────┐
│ 1. Browse    │ → Opens library with 10 exercise types
│   Library    │
└──────────────┘
       ↓
┌──────────────┐
│ 2. Preview   │ → Sees interactive demo with sample data
│   Exercise   │
└──────────────┘
       ↓
┌──────────────┐
│ 3. Configure │ → Wizard: Name, Duration, Context, Options
│   Exercise   │
└──────────────┘
       ↓
┌──────────────┐
│ 4. Generate  │ → AI generates content using context
│   Content    │    (Programa + Fase + ProofPoint + Instructor notes)
└──────────────┘
       ↓
┌──────────────┐
│ 5. Review &  │ → Edits draft, then publishes
│   Publish    │
└──────────────┘

Student Flow:
┌──────────────┐
│ 1. View PP   │ → Sees proof point with list of exercises
└──────────────┘
       ↓
┌──────────────┐
│ 2. Start     │ → Opens exercise player (specific component)
│   Exercise   │
└──────────────┘
       ↓
┌──────────────┐
│ 3. Interact  │ → Works through exercise (AI-mediated)
│   with AI    │
└──────────────┘
       ↓
┌──────────────┐
│ 4. Complete  │ → Marks complete, unlocks next
└──────────────┘
```

---

## Implementation Phases

### **Phase 1: Database Schema Simplification** (Week 1)
- [ ] Create migration to remove legacy tables
- [ ] Update schema to 20 core tables
- [ ] Seed 10 exercise templates
- [ ] Test data integrity

### **Phase 2: Domain Layer Implementation** (Week 2)
- [ ] Create domain entities for all contexts
- [ ] Implement value objects
- [ ] Build domain services
- [ ] Define domain events
- [ ] Write unit tests for domain logic

### **Phase 3: Application Layer** (Week 3)
- [ ] Implement use cases for each context
- [ ] Create DTOs and mappers
- [ ] Build query handlers
- [ ] Integration tests

### **Phase 4: Infrastructure Layer** (Week 4)
- [ ] Implement repositories with SurrealDB
- [ ] Create database adapters
- [ ] Build OpenAI client
- [ ] Set up event bus

### **Phase 5: API Refactoring** (Week 5)
- [ ] Refactor controllers to use use cases
- [ ] Update routes
- [ ] API documentation (Swagger)
- [ ] E2E API tests

### **Phase 6: Frontend Atomic Design** (Week 6)
- [ ] Create atomic components library
- [ ] Build exercise library UI
- [ ] Implement exercise wizard
- [ ] Create 10 exercise players

### **Phase 7: Integration & Testing** (Week 7)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Documentation

---

## Key Design Patterns

1. **Repository Pattern**: Abstract data access
2. **Unit of Work**: Transaction management
3. **Factory Pattern**: Create domain objects
4. **Strategy Pattern**: Different exercise types
5. **Observer Pattern**: Domain events
6. **Builder Pattern**: Prompt and context building
7. **Adapter Pattern**: External services (OpenAI, SurrealDB)
8. **Facade Pattern**: Simplify complex subsystems

---

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Domain logic isolated from infrastructure
3. **Flexibility**: Easy to swap implementations (e.g., different database)
4. **Scalability**: Can extract bounded contexts into microservices
5. **Maintainability**: Clear structure, easy to navigate
6. **Reusability**: Components and domain logic highly reusable
7. **Type Safety**: Full TypeScript coverage prevents bugs
8. **Domain Focus**: Business logic is central, not database or framework

---

## Migration Strategy

1. **Parallel Development**: Build new system alongside old
2. **Feature Flags**: Toggle between old and new implementations
3. **Gradual Migration**: Migrate one bounded context at a time
4. **Data Migration**: Scripts to migrate from old to new schema
5. **Rollback Plan**: Keep old system available for 2 weeks

---

## Next Steps

1. Review and approve this architecture document
2. Begin Phase 1: Database schema simplification
3. Set up new project structure
4. Create first domain entities and use cases
5. Write tests for domain logic

**Estimated Timeline**: 7 weeks
**Team Size**: 1-2 developers
**Risk Level**: Medium (careful migration required)

---

**Document Version**: 1.0
**Date**: 2025-11-06
**Author**: DDD Refactoring Team
