# Refactorización DDD - Estado Actual y Continuación

## 📋 Resumen Ejecutivo

Se ha iniciado la refactorización completa de la plataforma Xpertia Classroom aplicando Domain-Driven Design (DDD) con arquitectura en capas limpias. El objetivo es simplificar de 60+ tablas a ~20, desacoplar componentes y crear una arquitectura mantenible y escalable.

---

## ✅ Completado

### 1. Documentación y Planificación
- ✅ **DDD_ARCHITECTURE.md**: Arquitectura completa DDD documentada
  - 7 Bounded Contexts definidos
  - Estructura de 4 capas (Domain, Application, Infrastructure, Presentation)
  - Plan de simplificación de base de datos (60+ → 20 tablas)
  - Timeline de 7 semanas
  - Atomic Design para frontend

### 2. Migración de Base de Datos
- ✅ **002-simplify-schema-ddd.surql**: Migración creada
  - Elimina 13 tablas legacy (versioning, portafolio)
  - Simplifica progreso y evaluación
  - Mantiene 20 tablas core

### 3. Estructura de Carpetas DDD
```
apps/api/src/
├── domain/
│   ├── program-design/        ✅ Creado
│   ├── exercise-catalog/      ✅ Creado
│   ├── exercise-instance/     ✅ Creado
│   ├── cohort/                ✅ Creado
│   ├── student-progress/      ✅ Creado
│   └── shared/                ✅ Creado
├── application/
│   ├── program-design/        ✅ Creado
│   ├── exercise-catalog/      ✅ Creado
│   ├── exercise-instance/     ✅ Creado
│   ├── cohort/                ✅ Creado
│   ├── student-progress/      ✅ Creado
│   └── shared/                ✅ Creado
└── infrastructure/
    ├── database/              ✅ Creado
    ├── ai/                    ✅ Creado
    ├── events/                ✅ Creado
    └── mappers/               ✅ Creado
```

### 4. Domain Layer - Shared
- ✅ **RecordId.ts**: Value Object para IDs de SurrealDB
- ✅ **Timestamp.ts**: Value Object para timestamps
- ✅ **Entity.ts**: Clase base para entidades
- ✅ **AggregateRoot.ts**: Clase base para aggregate roots
- ✅ **ValueObject.ts**: Clase base para value objects
- ✅ **DomainEvent.ts**: Clase base para eventos de dominio
- ✅ **IRepository.ts**: Interface base para repositorios

### 5. Application Layer - Shared
- ✅ **Result.ts**: Tipo Result para manejo de errores funcional
- ✅ **IUseCase.ts**: Interface para use cases
- ✅ **IQuery.ts**: Interface para queries
- ✅ **ICommand.ts**: Interface para commands

### 6. Domain Layer - Program Design
- ✅ **ProgramStatus.ts**: Value Object para estado de programas
- ✅ **Duration.ts**: Value Object para duraciones
- ✅ **ProofPointSlug.ts**: Value Object para slugs
- ✅ **Programa.ts**: Entidad Programa (Aggregate Root)
- ✅ **ProgramPublishedEvent.ts**: Evento de dominio

---

## 🚧 Pendiente (En orden de prioridad)

### Fase 1: Completar Domain Layer (Semana 1)

#### Program Design Context
```typescript
// 1. Completar entidades
apps/api/src/domain/program-design/entities/
- [ ] Fase.ts
- [ ] ProofPoint.ts
- [ ] FaseDocumentation.ts

// 2. Agregar servicios de dominio
apps/api/src/domain/program-design/services/
- [ ] ProgramValidator.ts
- [ ] PrerequisiteResolver.ts

// 3. Más eventos
apps/api/src/domain/program-design/events/
- [ ] ProofPointAddedEvent.ts
- [ ] PhaseOrderChangedEvent.ts

// 4. Interface de repositorio
apps/api/src/domain/program-design/repositories/
- [ ] IProgramRepository.ts
```

#### Exercise Catalog Context
```typescript
apps/api/src/domain/exercise-catalog/
├── entities/
│   └── [ ] ExerciseTemplate.ts
├── value-objects/
│   ├── [ ] ExerciseCategory.ts
│   ├── [ ] ConfigurationSchema.ts
│   └── [ ] PromptTemplate.ts
├── services/
│   ├── [ ] ConfigurationValidator.ts
│   └── [ ] TemplateInterpolator.ts
└── repositories/
    └── [ ] IExerciseTemplateRepository.ts
```

#### Exercise Instance Context
```typescript
apps/api/src/domain/exercise-instance/
├── entities/
│   ├── [ ] ExerciseInstance.ts
│   └── [ ] ExerciseContent.ts
├── aggregates/
│   └── [ ] ExerciseInstanceAggregate.ts
├── services/
│   ├── [ ] ContentGenerator.ts
│   └── [ ] ContextBuilder.ts
└── repositories/
    └── [ ] IExerciseInstanceRepository.ts
```

#### Cohort Context
```typescript
apps/api/src/domain/cohort/
├── entities/
│   ├── [ ] Cohorte.ts
│   └── [ ] Inscripcion.ts
├── value-objects/
│   ├── [ ] DateRange.ts
│   └── [ ] CohortStatus.ts
├── services/
│   ├── [ ] ProgramSnapshotter.ts
│   └── [ ] EnrollmentManager.ts
└── repositories/
    └── [ ] ICohortRepository.ts
```

#### Student Progress Context
```typescript
apps/api/src/domain/student-progress/
├── entities/
│   ├── [ ] ProofPointProgress.ts
│   ├── [ ] ExerciseProgress.ts
│   └── [ ] StudentData.ts
├── value-objects/
│   ├── [ ] ProgressStatus.ts
│   └── [ ] Score.ts
├── services/
│   ├── [ ] ProgressCalculator.ts
│   └── [ ] PrerequisiteChecker.ts
└── repositories/
    └── [ ] IProgressRepository.ts
```

### Fase 2: Infrastructure Layer (Semana 2)

```typescript
apps/api/src/infrastructure/database/repositories/
- [ ] ProgramRepository.ts
- [ ] ExerciseTemplateRepository.ts
- [ ] ExerciseInstanceRepository.ts
- [ ] CohortRepository.ts
- [ ] ProgressRepository.ts

apps/api/src/infrastructure/mappers/
- [ ] ProgramMapper.ts
- [ ] ExerciseMapper.ts
- [ ] CohortMapper.ts
- [ ] ProgressMapper.ts
```

### Fase 3: Application Layer (Semana 3)

```typescript
apps/api/src/application/program-design/use-cases/
- [ ] CreateProgram/
- [ ] UpdateProgram/
- [ ] PublishProgram/
- [ ] AddProofPoint/
- [ ] UpdateProofPoint/

apps/api/src/application/exercise-instance/use-cases/
- [ ] AddExerciseToProofPoint/
- [ ] GenerateExerciseContent/
- [ ] PublishExercise/
- [ ] ReorderExercises/

apps/api/src/application/student-progress/use-cases/
- [ ] StartExercise/
- [ ] CompleteExercise/
- [ ] SaveStudentData/
- [ ] UnlockProofPoint/
```

### Fase 4: Refactorizar API Controllers (Semana 4)

```typescript
// Migrar controllers existentes a usar use cases
apps/api/src/domains/programas/ → usar application/program-design/use-cases/
apps/api/src/domains/ejercicios/ → usar application/exercise-*/use-cases/
apps/api/src/domains/cohortes/ → usar application/cohort/use-cases/
```

### Fase 5: Frontend Atomic Design (Semanas 5-6)

```typescript
apps/instructor-app/components/
├── atoms/
│   ├── [ ] Button (refactor existing)
│   ├── [ ] Input (refactor existing)
│   ├── [ ] Card (refactor existing)
│   └── [ ] Badge (refactor existing)
├── molecules/
│   ├── [ ] ExerciseCard
│   ├── [ ] ProofPointHeader
│   ├── [ ] ProgressBar
│   └── [ ] ConfigField
├── organisms/
│   ├── [ ] ExerciseLibrary
│   ├── [ ] ExerciseWizard
│   ├── [ ] ProgramEditor
│   └── [ ] ProgressDashboard
└── templates/
    ├── [ ] InstructorLayout
    └── [ ] StudentLayout
```

### Fase 6: Exercise System (Semana 6)

```typescript
// 10 Exercise Players
apps/instructor-app/components/exercise-players/
- [ ] LeccionInteractivaPlayer.tsx
- [ ] CuadernoTrabajoPlayer.tsx
- [ ] SimulacionInteraccionPlayer.tsx
- [ ] MentorIAPlayer.tsx
- [ ] HerramientaAnalisisPlayer.tsx
- [ ] HerramientaCreacionPlayer.tsx
- [ ] SistemaTrackingPlayer.tsx
- [ ] HerramientaRevisionPlayer.tsx
- [ ] SimuladorEntornoPlayer.tsx
- [ ] SistemaProgresionPlayer.tsx
```

---

## 🎯 Próximos Pasos Inmediatos

### 1. Completar Entidades de Program Design

Crear los archivos faltantes siguiendo el patrón de `Programa.ts`:

**Fase.ts**:
```typescript
import { Entity } from '../../shared/types/Entity';
import { RecordId } from '../../shared/value-objects/RecordId';
import { Timestamp } from '../../shared/value-objects/Timestamp';
import { Duration } from '../value-objects/Duration';

export interface FaseProps {
  programa: RecordId;
  numeroFase: number;
  nombre: string;
  descripcion?: string;
  objetivosAprendizaje: string[];
  duracion: Duration;
  orden: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class Fase extends Entity<FaseProps> {
  static create(/* params */): Fase { /* ... */ }
  static reconstitute(id: RecordId, props: FaseProps): Fase { /* ... */ }

  // Business methods
  updateInfo(/* params */): void { /* ... */ }
  reorder(newOrder: number): void { /* ... */ }

  // Getters
  getNombre(): string { return this.props.nombre; }
  getNumeroFase(): number { return this.props.numeroFase; }

  toPersistence(): any { /* ... */ }
}
```

**ProofPoint.ts**:
```typescript
import { Entity } from '../../shared/types/Entity';
import { RecordId } from '../../shared/value-objects/RecordId';
import { ProofPointSlug } from '../value-objects/ProofPointSlug';
import { Duration } from '../value-objects/Duration';

export interface ProofPointProps {
  fase: RecordId;
  nombre: string;
  slug: ProofPointSlug;
  descripcion?: string;
  preguntaCentral?: string;
  ordenEnFase: number;
  duracion: Duration;
  tipoEntregableFinal?: string;
  documentacionContexto: string;
  prerequisitos: RecordId[]; // Other proof points
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class ProofPoint extends Entity<ProofPointProps> {
  static create(/* params */): ProofPoint { /* ... */ }
  static reconstitute(id: RecordId, props: ProofPointProps): ProofPoint { /* ... */ }

  // Business methods
  updateInfo(/* params */): void { /* ... */ }
  addPrerequisite(ppId: RecordId): void { /* ... */ }
  removePrerequisite(ppId: RecordId): void { /* ... */ }
  updateDocumentation(doc: string): void { /* ... */ }

  // Queries
  hasPrerequisites(): boolean { /* ... */ }
  getPrerequisites(): RecordId[] { return this.props.prerequisitos; }

  toPersistence(): any { /* ... */ }
}
```

### 2. Implementar Repositorio de Programa

**IProgramRepository.ts**:
```typescript
import { IRepository } from '../../shared/repositories/IRepository';
import { Programa } from '../entities/Programa';
import { RecordId } from '../../shared/value-objects/RecordId';
import { ProgramStatus } from '../value-objects/ProgramStatus';

export interface IProgramRepository extends IRepository<Programa> {
  findByCreador(creadorId: RecordId): Promise<Programa[]>;
  findByStatus(status: ProgramStatus): Promise<Programa[]>;
  findWithFases(id: RecordId): Promise<Programa | null>;
  saveWithStructure(programa: Programa, fases: Fase[], proofPoints: ProofPoint[]): Promise<void>;
}
```

**ProgramRepository.ts** (Infrastructure):
```typescript
import { Injectable } from '@nestjs/common';
import { SurrealDbService } from 'src/core/database';
import { IProgramRepository } from 'src/domain/program-design/repositories/IProgramRepository';
import { Programa } from 'src/domain/program-design/entities/Programa';
import { ProgramMapper } from '../mappers/ProgramMapper';

@Injectable()
export class ProgramRepository implements IProgramRepository {
  constructor(
    private readonly surrealDb: SurrealDbService,
    private readonly mapper: ProgramMapper,
  ) {}

  async findById(id: RecordId): Promise<Programa | null> {
    const query = 'SELECT * FROM type::thing("programa", $id)';
    const result = await this.surrealDb.query(query, { id: id.getId() });

    if (!result || result.length === 0) return null;

    return this.mapper.toDomain(result[0]);
  }

  async save(programa: Programa): Promise<Programa> {
    const data = programa.toPersistence();
    const query = 'UPDATE $id CONTENT $data';
    await this.surrealDb.query(query, { id: programa.getId().toString(), data });
    return programa;
  }

  // ... implement other methods
}
```

### 3. Crear Use Case de Ejemplo

**CreateProgramUseCase.ts**:
```typescript
import { Injectable } from '@nestjs/common';
import { ICommand } from 'src/application/shared/interfaces/IUseCase';
import { Result } from 'src/application/shared/types/Result';
import { IProgramRepository } from 'src/domain/program-design/repositories/IProgramRepository';
import { Programa } from 'src/domain/program-design/entities/Programa';
import { RecordId } from 'src/domain/shared/value-objects/RecordId';

export interface CreateProgramRequest {
  nombre: string;
  descripcion: string;
  duracionSemanas: number;
  creadorId: string;
}

export interface CreateProgramResponse {
  programaId: string;
  nombre: string;
}

@Injectable()
export class CreateProgramUseCase implements ICommand<CreateProgramRequest, CreateProgramResponse> {
  constructor(private readonly programRepository: IProgramRepository) {}

  async execute(request: CreateProgramRequest): Promise<Result<CreateProgramResponse>> {
    try {
      // Validate
      if (request.nombre.length < 3) {
        return Result.fail(new Error('Program name must be at least 3 characters'));
      }

      // Create domain entity
      const creadorId = RecordId.fromString(request.creadorId);
      const programa = Programa.create(
        request.nombre,
        request.descripcion,
        request.duracionSemanas,
        creadorId,
      );

      // Save
      const savedPrograma = await this.programRepository.save(programa);

      // Return response
      return Result.ok({
        programaId: savedPrograma.getId().toString(),
        nombre: savedPrograma.getNombre(),
      });
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
```

### 4. Refactorizar Controller

**ProgramController.ts** (antes):
```typescript
@Post()
async create(@Body() dto: CreateProgramDto) {
  // Logic mezclada con infrastructure
  const result = await this.surrealDb.query('CREATE programa ...');
  return result;
}
```

**ProgramController.ts** (después):
```typescript
@Controller('programs')
export class ProgramController {
  constructor(
    private readonly createProgramUseCase: CreateProgramUseCase,
    private readonly getProgramUseCase: GetProgramUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateProgramRequestDTO) {
    const result = await this.createProgramUseCase.execute(dto);

    return result.match({
      ok: (response) => ({ success: true, data: response }),
      fail: (error) => { throw new BadRequestException(error.message); },
    });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.getProgramUseCase.execute({ id });

    return result.match({
      ok: (response) => ({ success: true, data: response }),
      fail: (error) => { throw new NotFoundException(error.message); },
    });
  }
}
```

---

## 📐 Patrones a Seguir

### 1. **Entities**
- Extienden `Entity<T>` o `AggregateRoot<T>`
- Factory method `create()` para nuevas instancias
- Factory method `reconstitute()` para cargar desde DB
- Business methods que modifican estado
- Método `toPersistence()` para serialización

### 2. **Value Objects**
- Extienden `ValueObject<T>`
- Son inmutables
- Implementan `equals()`
- Validan en constructor

### 3. **Repositories**
- Interface en Domain Layer
- Implementación en Infrastructure Layer
- Trabajan con entidades, no DTOs
- Usan mappers para conversión

### 4. **Use Cases**
- Un archivo por use case
- Implementan `ICommand` o `IQuery`
- Retornan `Result<T, E>`
- No dependen de infrastructure directamente

### 5. **Controllers**
- Delgados, solo routing
- Llaman a use cases
- Manejan Result con `.match()`
- Convierten errores a HTTP exceptions

---

## 🔧 Comandos Útiles

### Aplicar migración de base de datos
```bash
cd packages/database
pnpm run migrate
```

### Ejecutar tests
```bash
cd apps/api
pnpm test
```

### Build del proyecto
```bash
pnpm build
```

---

## 📚 Referencias

- **DDD_ARCHITECTURE.md**: Arquitectura completa
- **002-simplify-schema-ddd.surql**: Migración de DB
- **apps/api/src/domain/**: Ejemplos de entities y value objects
- **apps/api/src/application/**: Ejemplos de use cases

---

## ⚠️ Puntos Importantes

1. **No eliminar código existente aún**: Trabajar en paralelo hasta que la nueva arquitectura esté completa
2. **Seguir el patrón establecido**: Usar las clases base (Entity, AggregateRoot, ValueObject)
3. **Test-Driven**: Escribir tests para cada entidad y use case
4. **Domain First**: Implementar domain layer antes que infrastructure
5. **Migraciones graduales**: Migrar un bounded context a la vez

---

## 🎓 Lecciones Aprendidas

1. **Value Objects son poderosos**: Encapsulan validación y comportamiento
2. **Result type evita excepciones**: Hace el flujo de errores explícito
3. **Repositories abstraen persistencia**: Facilita testing y cambio de DB
4. **Use Cases orquestan**: Mantienen la lógica de aplicación separada del dominio
5. **Events desacoplan**: Permiten reaccionar a cambios sin acoplamiento directo

---

**Última Actualización**: 2025-11-06
**Estado**: 30% Completado
**Siguiente Milestone**: Completar Domain Layer (Semana 1)
