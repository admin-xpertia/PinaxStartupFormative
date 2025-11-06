# Guía de Implementación - Refactorización DDD

## 🎯 Objetivo

Transformar Xpertia en un sistema limpio, mantenible y escalable usando Domain-Driven Design, reduciendo complejidad y mejorando la separación de responsabilidades.

---

## 📂 Archivos Creados

### Documentación
1. **DDD_ARCHITECTURE.md** - Arquitectura completa del sistema
2. **REFACTORING_PROGRESS.md** - Estado actual y tareas pendientes
3. **IMPLEMENTATION_GUIDE.md** - Esta guía

### Migración de Base de Datos
4. **packages/database/migrations/002-simplify-schema-ddd.surql**
   - Elimina 13 tablas legacy
   - Simplifica a 20 tablas core

### Domain Layer - Shared

**Value Objects**:
5. **apps/api/src/domain/shared/value-objects/RecordId.ts**
6. **apps/api/src/domain/shared/value-objects/Timestamp.ts**

**Base Classes**:
7. **apps/api/src/domain/shared/types/Entity.ts**
8. **apps/api/src/domain/shared/types/AggregateRoot.ts**
9. **apps/api/src/domain/shared/types/ValueObject.ts**

**Events**:
10. **apps/api/src/domain/shared/events/DomainEvent.ts**

**Repositories**:
11. **apps/api/src/domain/shared/repositories/IRepository.ts**

### Application Layer - Shared

12. **apps/api/src/application/shared/types/Result.ts**
13. **apps/api/src/application/shared/interfaces/IUseCase.ts**

### Domain Layer - Program Design

**Value Objects**:
14. **apps/api/src/domain/program-design/value-objects/ProgramStatus.ts**
15. **apps/api/src/domain/program-design/value-objects/Duration.ts**
16. **apps/api/src/domain/program-design/value-objects/ProofPointSlug.ts**

**Entities**:
17. **apps/api/src/domain/program-design/entities/Programa.ts**

**Events**:
18. **apps/api/src/domain/program-design/events/ProgramPublishedEvent.ts**

---

## 🏗️ Estructura de Carpetas Creada

```
apps/api/src/
├── domain/
│   ├── program-design/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── services/
│   │   ├── events/
│   │   └── repositories/
│   ├── exercise-catalog/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── services/
│   │   └── repositories/
│   ├── exercise-instance/
│   │   ├── entities/
│   │   ├── aggregates/
│   │   ├── services/
│   │   └── repositories/
│   ├── cohort/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── services/
│   │   └── repositories/
│   ├── student-progress/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── services/
│   │   └── repositories/
│   └── shared/
│       ├── value-objects/
│       ├── types/
│       ├── events/
│       └── repositories/
├── application/
│   ├── program-design/
│   │   ├── use-cases/
│   │   ├── queries/
│   │   └── dto/
│   ├── exercise-catalog/
│   │   ├── use-cases/
│   │   ├── queries/
│   │   └── dto/
│   ├── exercise-instance/
│   │   ├── use-cases/
│   │   ├── queries/
│   │   └── dto/
│   ├── cohort/
│   │   ├── use-cases/
│   │   ├── queries/
│   │   └── dto/
│   ├── student-progress/
│   │   ├── use-cases/
│   │   ├── queries/
│   │   └── dto/
│   └── shared/
│       ├── interfaces/
│       └── types/
└── infrastructure/
    ├── database/
    │   └── repositories/
    ├── ai/
    ├── events/
    └── mappers/
```

---

## 🚀 Cómo Continuar

### Paso 1: Completar Entidades del Program Design Context

**Crear Fase.ts**:
```bash
touch apps/api/src/domain/program-design/entities/Fase.ts
```

Implementar siguiendo el patrón de `Programa.ts`:
- Factory methods: `create()` y `reconstitute()`
- Getters para propiedades
- Business methods (updateInfo, reorder, etc.)
- Método `toPersistence()`

**Crear ProofPoint.ts**:
```bash
touch apps/api/src/domain/program-design/entities/ProofPoint.ts
```

Implementar:
- Manejo de prerequisitos (addPrerequisite, removePrerequisite)
- Validación de slug único
- Documentación de contexto para generación de ejercicios

**Crear FaseDocumentation.ts**:
```bash
touch apps/api/src/domain/program-design/entities/FaseDocumentation.ts
```

### Paso 2: Servicios de Dominio

**ProgramValidator.ts**:
```typescript
export class ProgramValidator {
  validate(programa: Programa): Result<void, ValidationError> {
    // Validar que tiene al menos 1 fase
    // Validar que cada fase tiene al menos 1 proof point
    // Validar que no hay ciclos en prerequisitos
    // etc.
  }
}
```

**PrerequisiteResolver.ts**:
```typescript
export class PrerequisiteResolver {
  resolvePrerequisites(
    proofPoints: ProofPoint[]
  ): Map<RecordId, ProofPoint[]> {
    // Resolver el grafo de dependencias
    // Retornar ordenamiento topológico
  }

  detectCycles(proofPoints: ProofPoint[]): boolean {
    // Detectar ciclos en prerequisitos
  }
}
```

### Paso 3: Repositorio de Program Design

**IProgramRepository.ts** (domain layer):
```typescript
export interface IProgramRepository extends IRepository<Programa> {
  findByCreador(creadorId: RecordId): Promise<Programa[]>;
  findByStatus(status: ProgramStatus): Promise<Programa[]>;
  findWithFullStructure(id: RecordId): Promise<{
    programa: Programa;
    fases: Fase[];
    proofPoints: ProofPoint[];
  } | null>;
}
```

**ProgramRepository.ts** (infrastructure layer):
```bash
touch apps/api/src/infrastructure/database/repositories/ProgramRepository.ts
```

Implementar usando `SurrealDbService` y mappers.

**ProgramMapper.ts**:
```bash
touch apps/api/src/infrastructure/mappers/ProgramMapper.ts
```

```typescript
export class ProgramMapper {
  toDomain(raw: any): Programa {
    // Convert DB record to domain entity
  }

  toPersistence(programa: Programa): any {
    return programa.toPersistence();
  }
}
```

### Paso 4: Use Cases

**CreateProgramUseCase.ts**:
```bash
mkdir -p apps/api/src/application/program-design/use-cases/CreateProgram
touch apps/api/src/application/program-design/use-cases/CreateProgram/CreateProgramUseCase.ts
touch apps/api/src/application/program-design/use-cases/CreateProgram/CreateProgramDTO.ts
```

Implementar patrón:
1. Validar request
2. Crear entidad de dominio
3. Guardar en repositorio
4. Publicar eventos
5. Retornar Result<Response>

**PublishProgramUseCase.ts**:
```bash
mkdir -p apps/api/src/application/program-design/use-cases/PublishProgram
```

Implementar:
1. Cargar programa
2. Validar con `ProgramValidator`
3. Llamar a `programa.publish()`
4. Guardar
5. Publicar evento `ProgramPublishedEvent`

### Paso 5: Refactorizar Controller

**Ejemplo de refactorización**:

**Antes** (apps/api/src/domains/programas/programas.controller.ts):
```typescript
@Post()
async create(@Body() createDto: CreateProgramaDto, @User() user) {
  // Lógica mezclada con acceso a base de datos
  const result = await this.surrealDb.query(
    'CREATE programa CONTENT $data',
    { data: {...} }
  );
  return result;
}
```

**Después** (apps/api/src/presentation/controllers/ProgramController.ts):
```typescript
@Post()
async create(
  @Body() dto: CreateProgramRequestDTO,
  @User() user: AuthUser
) {
  const result = await this.createProgramUseCase.execute({
    ...dto,
    creadorId: user.id,
  });

  return result.match({
    ok: (response) => ({
      success: true,
      data: response,
    }),
    fail: (error) => {
      this.logger.error('Failed to create program', error);
      throw new BadRequestException(error.message);
    },
  });
}
```

### Paso 6: Exercise Catalog Context

Seguir el mismo patrón:

1. **Value Objects**:
   - ExerciseCategory
   - ConfigurationSchema
   - PromptTemplate

2. **Entity**:
   - ExerciseTemplate (Aggregate Root)

3. **Services**:
   - ConfigurationValidator
   - TemplateInterpolator

4. **Repository**:
   - IExerciseTemplateRepository
   - ExerciseTemplateRepository

5. **Use Cases**:
   - GetTemplateLibrary
   - GetTemplateById
   - ValidateConfiguration
   - PreviewExercise

### Paso 7: Exercise Instance Context

1. **Entities**:
   - ExerciseInstance
   - ExerciseContent

2. **Aggregate**:
   - ExerciseInstanceAggregate (combina instance + content)

3. **Services**:
   - ContentGenerator (usa OpenAI)
   - ContextBuilder (construye contexto para generación)

4. **Use Cases**:
   - AddExerciseToProofPoint
   - GenerateExerciseContent
   - PublishExercise
   - ReorderExercises
   - DeleteExercise

---

## 🧪 Testing

### Unit Tests (Domain Layer)

**Programa.test.ts**:
```typescript
describe('Programa', () => {
  it('should create a new program', () => {
    const programa = Programa.create(
      'Test Program',
      'Description',
      12,
      RecordId.create('user', '123')
    );

    expect(programa.getNombre()).toBe('Test Program');
    expect(programa.isDraft()).toBe(true);
  });

  it('should publish a draft program', () => {
    const programa = Programa.create(/* ... */);
    programa.publish();

    expect(programa.isPublished()).toBe(true);
    expect(programa.getDomainEvents()).toHaveLength(1);
    expect(programa.getDomainEvents()[0]).toBeInstanceOf(ProgramPublishedEvent);
  });

  it('should not allow editing published program', () => {
    const programa = Programa.create(/* ... */);
    programa.publish();

    expect(() => {
      programa.updateInfo('New Name');
    }).toThrow();
  });
});
```

### Integration Tests (Infrastructure Layer)

**ProgramRepository.test.ts**:
```typescript
describe('ProgramRepository', () => {
  let repository: ProgramRepository;
  let surrealDb: SurrealDbService;

  beforeEach(async () => {
    // Setup test database
  });

  it('should save and retrieve a program', async () => {
    const programa = Programa.create(/* ... */);
    await repository.save(programa);

    const retrieved = await repository.findById(programa.getId());

    expect(retrieved).not.toBeNull();
    expect(retrieved!.getNombre()).toBe(programa.getNombre());
  });
});
```

### E2E Tests (Use Cases)

**CreateProgramUseCase.test.ts**:
```typescript
describe('CreateProgramUseCase', () => {
  it('should create a new program', async () => {
    const useCase = new CreateProgramUseCase(mockRepository);
    const result = await useCase.execute({
      nombre: 'Test Program',
      descripcion: 'Description',
      duracionSemanas: 12,
      creadorId: 'user:123',
    });

    expect(result.isOk()).toBe(true);
    expect(result.getValue().nombre).toBe('Test Program');
  });

  it('should fail with invalid name', async () => {
    const useCase = new CreateProgramUseCase(mockRepository);
    const result = await useCase.execute({
      nombre: 'AB', // Too short
      /* ... */
    });

    expect(result.isFail()).toBe(true);
  });
});
```

---

## 📋 Checklist de Calidad

Antes de considerar completo un bounded context:

- [ ] Todas las entidades tienen tests unitarios
- [ ] Value objects validan correctamente
- [ ] Repositorios tienen tests de integración
- [ ] Use cases tienen tests E2E
- [ ] Controllers son delgados (< 20 líneas por método)
- [ ] No hay dependencias circulares
- [ ] Domain layer no depende de infrastructure
- [ ] Todos los métodos públicos están documentados
- [ ] Result type usado consistentemente
- [ ] Events emitidos en lugares correctos

---

## 🎨 Frontend: Atomic Design

### Atoms (Componentes más básicos)

**Button.tsx** (ejemplo):
```typescript
// apps/instructor-app/components/atoms/Button/Button.tsx

export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({
  variant,
  size,
  disabled,
  loading,
  onClick,
  children,
}: ButtonProps) {
  // Single responsibility: render a button
  // No business logic
  // Fully controlled by parent
  return (
    <button
      className={cn(variants[variant], sizes[size])}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
```

**Button.types.ts**:
```typescript
export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

**Button.test.tsx**:
```typescript
describe('Button', () => {
  it('should render children', () => {
    render(<Button variant="primary" size="md">Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button variant="primary" size="md" onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Molecules (Composición simple)

**ExerciseCard.tsx**:
```typescript
interface ExerciseCardProps {
  template: ExerciseTemplate;
  onSelect: (templateId: string) => void;
  onPreview: (templateId: string) => void;
}

export function ExerciseCard({ template, onSelect, onPreview }: ExerciseCardProps) {
  return (
    <Card>
      <CardHeader>
        <Icon name={template.icono} color={template.color} />
        <Heading size="sm">{template.nombre}</Heading>
      </CardHeader>
      <CardBody>
        <Text>{template.descripcion}</Text>
      </CardBody>
      <CardFooter>
        <Button variant="outline" onClick={() => onPreview(template.id)}>
          Preview
        </Button>
        <Button variant="primary" onClick={() => onSelect(template.id)}>
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Organisms (Secciones complejas)

**ExerciseLibrary.tsx**:
```typescript
export function ExerciseLibrary({ proofPointId }: { proofPointId: string }) {
  const { templates, loading } = useExerciseTemplates();
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);

  return (
    <div className="exercise-library">
      <CategoryFilter
        categories={EXERCISE_CATEGORIES}
        selected={selectedCategory}
        onChange={setSelectedCategory}
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Grid>
          {templates
            .filter(t => !selectedCategory || t.categoria === selectedCategory)
            .map(template => (
              <ExerciseCard
                key={template.id}
                template={template}
                onSelect={handleSelect}
                onPreview={handlePreview}
              />
            ))}
        </Grid>
      )}
    </div>
  );
}
```

**Custom Hook** (useExerciseTemplates.ts):
```typescript
export function useExerciseTemplates() {
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch('/api/exercise-templates');
        const data = await response.json();
        setTemplates(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  return { templates, loading, error };
}
```

---

## 🛠️ Herramientas y Comandos

### Crear nueva entidad
```bash
# Script helper (crear si no existe)
./scripts/create-entity.sh program-design Fase
```

### Ejecutar tests
```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Con coverage
pnpm test:cov
```

### Linting
```bash
pnpm lint
pnpm lint:fix
```

### Type checking
```bash
pnpm type-check
```

---

## 📖 Referencias y Recursos

### Libros
- **Domain-Driven Design** - Eric Evans
- **Implementing Domain-Driven Design** - Vaughn Vernon
- **Clean Architecture** - Robert C. Martin

### Artículos
- [DDD, Hexagonal, Onion, Clean, CQRS](https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/)
- [DDD Aggregates](https://martinfowler.com/bliki/DDD_Aggregate.html)

### Ejemplos
- [Node.js DDD Example](https://github.com/stemmlerjs/ddd-forum)
- [NestJS DDD](https://github.com/nestjs/nest-ddd-example)

---

## 💡 Principios SOLID

### S - Single Responsibility
Cada clase tiene una única razón para cambiar.

✅ **Bien**:
```typescript
class ProgramValidator {
  validate(programa: Programa): ValidationResult {
    // Solo valida
  }
}

class ProgramRepository {
  save(programa: Programa): Promise<void> {
    // Solo persiste
  }
}
```

❌ **Mal**:
```typescript
class ProgramManager {
  validate(/* ... */) { }
  save(/* ... */) { }
  publish(/* ... */) { }
  generateContent(/* ... */) { }
  // Demasiadas responsabilidades
}
```

### O - Open/Closed
Abierto a extensión, cerrado a modificación.

✅ **Bien**:
```typescript
interface IExercisePlayer {
  render(): JSX.Element;
}

class LeccionPlayer implements IExercisePlayer {
  render() { /* ... */ }
}

class SimulacionPlayer implements IExercisePlayer {
  render() { /* ... */ }
}

// Para nuevo tipo, solo crear nueva clase
```

### L - Liskov Substitution
Los subtipos deben ser sustituibles por sus tipos base.

### I - Interface Segregation
Interfaces específicas mejor que una general.

✅ **Bien**:
```typescript
interface IReadRepository {
  findById(id: RecordId): Promise<T>;
  findAll(): Promise<T[]>;
}

interface IWriteRepository {
  save(entity: T): Promise<void>;
  delete(id: RecordId): Promise<void>;
}
```

### D - Dependency Inversion
Depender de abstracciones, no de concreciones.

✅ **Bien**:
```typescript
class CreateProgramUseCase {
  constructor(
    private readonly programRepository: IProgramRepository // Interface, no clase concreta
  ) {}
}
```

---

## ✅ Siguiente Sprint

1. Completar entidades Program Design (Fase, ProofPoint)
2. Implementar ProgramRepository
3. Crear 3 use cases principales:
   - CreateProgram
   - PublishProgram
   - AddProofPoint
4. Refactorizar ProgramasController
5. Escribir tests

**Tiempo estimado**: 1 semana
**Prioridad**: Alta

---

**Última actualización**: 2025-11-06
**Autor**: Claude Code DDD Team
**Versión**: 1.0
