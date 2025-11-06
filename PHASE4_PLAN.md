# Phase 4 - Presentation Layer Implementation Plan

## 🎯 Objetivo

Implementar la capa de presentación (REST API) con controllers, DTOs, documentación Swagger, validación y manejo de errores para exponer la funcionalidad del dominio.

**Fecha Inicio**: 2025-11-06
**Branch**: `claude/mira-process-setup-011CUsDauoSnFw5mKz2Qh3Ps`
**Estado**: 🟢 En Progreso

---

## 📋 Alcance de la Fase 4

### 1. **Controllers (REST API)**

Crear controllers para exponer endpoints HTTP:

```
apps/api/src/presentation/controllers/
├── program-design/
│   ├── ProgramController.ts           # CRUD programs
│   ├── FaseController.ts              # Fase management
│   └── ProofPointController.ts        # ProofPoint operations
├── exercise-catalog/
│   └── ExerciseTemplateController.ts  # Template catalog
└── exercise-instance/
    └── ExerciseInstanceController.ts  # Exercise assignments
```

### 2. **DTOs (Data Transfer Objects)**

Crear DTOs para requests y responses HTTP:

```
apps/api/src/presentation/dtos/
├── program-design/
│   ├── CreateProgramRequest.dto.ts
│   ├── UpdateProgramRequest.dto.ts
│   ├── ProgramResponse.dto.ts
│   ├── AddFaseRequest.dto.ts
│   └── ...
├── exercise-catalog/
│   └── ...
└── exercise-instance/
    └── ...
```

### 3. **Additional Use Cases**

Implementar casos de uso faltantes:

```
application/program-design/use-cases/
├── PublishProgram/
├── ArchiveProgram/
├── AddFaseToProgram/
├── UpdateFase/
├── AddProofPointToFase/
└── UpdateProofPoint/

application/exercise-instance/use-cases/
├── UpdateExerciseInstance/
├── ReorderExercises/
└── DeleteExerciseInstance/
```

### 4. **API Infrastructure**

- Swagger/OpenAPI setup
- Global exception filters
- Validation pipes
- Response interceptors
- Logging middleware

### 5. **Testing & Documentation**

- API endpoint testing
- Swagger documentation
- Postman collection

---

## 🗺️ Implementación Paso a Paso

### Step 1: Setup Infrastructure (30 min)

**1.1 Install Dependencies**
```bash
pnpm add --filter api @nestjs/swagger swagger-ui-express
pnpm add --filter api class-validator class-transformer
```

**1.2 Setup Swagger in main.ts**
```typescript
// apps/api/src/main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Xpertia Classroom API')
  .setDescription('AI-powered classroom management API')
  .setVersion('1.0')
  .addTag('programs')
  .addTag('exercises')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

**1.3 Global Validation Pipe**
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

**1.4 Global Exception Filter**
```typescript
// apps/api/src/presentation/filters/http-exception.filter.ts
```

---

### Step 2: Program Design Controllers (2 hours)

**2.1 ProgramController**

Endpoints:
- `POST /api/v1/programs` - Create program
- `GET /api/v1/programs` - List programs
- `GET /api/v1/programs/:id` - Get program
- `PUT /api/v1/programs/:id` - Update program
- `POST /api/v1/programs/:id/publish` - Publish program
- `POST /api/v1/programs/:id/archive` - Archive program
- `DELETE /api/v1/programs/:id` - Delete program

**2.2 FaseController**

Endpoints:
- `POST /api/v1/programs/:programId/fases` - Add fase
- `GET /api/v1/programs/:programId/fases` - List fases
- `GET /api/v1/fases/:id` - Get fase
- `PUT /api/v1/fases/:id` - Update fase
- `PUT /api/v1/programs/:programId/fases/reorder` - Reorder fases
- `DELETE /api/v1/fases/:id` - Delete fase

**2.3 ProofPointController**

Endpoints:
- `POST /api/v1/fases/:faseId/proof-points` - Add proof point
- `GET /api/v1/fases/:faseId/proof-points` - List proof points
- `GET /api/v1/proof-points/:id` - Get proof point
- `GET /api/v1/proof-points/slug/:slug` - Get by slug
- `PUT /api/v1/proof-points/:id` - Update proof point
- `PUT /api/v1/fases/:faseId/proof-points/reorder` - Reorder
- `DELETE /api/v1/proof-points/:id` - Delete proof point

---

### Step 3: Exercise Controllers (1.5 hours)

**3.1 ExerciseTemplateController**

Endpoints:
- `GET /api/v1/exercise-templates` - List templates
- `GET /api/v1/exercise-templates/:id` - Get template
- `GET /api/v1/exercise-templates/category/:category` - By category
- `POST /api/v1/exercise-templates` - Create template (admin)
- `PUT /api/v1/exercise-templates/:id` - Update template (admin)

**3.2 ExerciseInstanceController**

Endpoints:
- `POST /api/v1/proof-points/:ppId/exercises` - Add exercise
- `GET /api/v1/proof-points/:ppId/exercises` - List exercises
- `GET /api/v1/exercises/:id` - Get exercise
- `PUT /api/v1/exercises/:id` - Update exercise
- `PUT /api/v1/proof-points/:ppId/exercises/reorder` - Reorder
- `DELETE /api/v1/exercises/:id` - Delete exercise

---

### Step 4: Additional Use Cases (2 hours)

**4.1 Program Use Cases**
- PublishProgramUseCase
- ArchiveProgramUseCase
- UpdateProgramUseCase
- DeleteProgramUseCase

**4.2 Fase Use Cases**
- AddFaseToProgram UseCase
- UpdateFaseUseCase
- ReorderFasesUseCase
- DeleteFaseUseCase

**4.3 ProofPoint Use Cases**
- AddProofPointToFaseUseCase
- UpdateProofPointUseCase
- ReorderProofPointsUseCase
- DeleteProofPointUseCase

**4.4 Exercise Use Cases**
- UpdateExerciseInstanceUseCase
- ReorderExercisesUseCase
- DeleteExerciseInstanceUseCase

---

### Step 5: DTOs & Validation (1.5 hours)

**5.1 Create Request DTOs**
```typescript
// Example: CreateProgramRequest.dto.ts
export class CreateProgramRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  nombre: string;

  @ApiProperty()
  @IsString()
  descripcion: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  duracionSemanas: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categoria?: string;
}
```

**5.2 Create Response DTOs**
```typescript
// Example: ProgramResponse.dto.ts
export class ProgramResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  estado: string;

  @ApiProperty()
  createdAt: string;
}
```

---

## 📊 Estructura de Directorios Resultante

```
apps/api/src/
├── presentation/
│   ├── controllers/
│   │   ├── program-design/
│   │   │   ├── program.controller.ts
│   │   │   ├── fase.controller.ts
│   │   │   └── proof-point.controller.ts
│   │   ├── exercise-catalog/
│   │   │   └── exercise-template.controller.ts
│   │   └── exercise-instance/
│   │       └── exercise-instance.controller.ts
│   ├── dtos/
│   │   ├── program-design/
│   │   │   ├── create-program.dto.ts
│   │   │   ├── update-program.dto.ts
│   │   │   ├── program-response.dto.ts
│   │   │   └── ...
│   │   ├── exercise-catalog/
│   │   │   └── ...
│   │   └── exercise-instance/
│   │       └── ...
│   ├── filters/
│   │   ├── http-exception.filter.ts
│   │   └── domain-exception.filter.ts
│   └── interceptors/
│       └── response.interceptor.ts
├── application/
│   ├── program-design/use-cases/
│   │   ├── CreateProgram/
│   │   ├── PublishProgram/
│   │   ├── ArchiveProgram/
│   │   ├── UpdateProgram/
│   │   ├── AddFase/
│   │   ├── UpdateFase/
│   │   ├── AddProofPoint/
│   │   └── UpdateProofPoint/
│   └── exercise-instance/use-cases/
│       ├── AddExerciseToProofPoint/ (existing)
│       ├── UpdateExerciseInstance/
│       ├── ReorderExercises/
│       └── DeleteExerciseInstance/
├── modules/
│   ├── program-design.module.ts (update with new controllers)
│   ├── exercise-catalog.module.ts (update)
│   └── exercise-instance.module.ts (update)
└── main.ts (configure Swagger, validation, filters)
```

---

## 🎯 Success Criteria

### Controllers
- [ ] ProgramController con 7 endpoints
- [ ] FaseController con 6 endpoints
- [ ] ProofPointController con 7 endpoints
- [ ] ExerciseTemplateController con 5 endpoints
- [ ] ExerciseInstanceController con 6 endpoints

### Use Cases
- [ ] 8 nuevos use cases implementados
- [ ] Todos con validación y error handling
- [ ] Integrados con repositorios

### Infrastructure
- [ ] Swagger configurado y funcionando
- [ ] Validation pipes globales
- [ ] Exception filters implementados
- [ ] Logging middleware

### Documentation
- [ ] Todos los endpoints documentados en Swagger
- [ ] DTOs con @ApiProperty decorators
- [ ] Ejemplos de requests/responses

---

## 📈 Métricas Esperadas

```
Endpoints REST:        31 endpoints
Use Cases Nuevos:      8 use cases
DTOs:                  ~25 DTOs
Líneas de Código:      ~3,000 líneas
Tiempo Estimado:       8 hours
```

---

## 🚀 Orden de Implementación

### Día 1 - Setup & Program Design (4 hours)
1. ✅ Setup Swagger/OpenAPI
2. ✅ Setup validation pipes
3. ✅ Setup exception filters
4. ✅ ProgramController + DTOs
5. ✅ PublishProgram use case
6. ✅ ArchiveProgram use case

### Día 2 - Fases & ProofPoints (2 hours)
7. ✅ FaseController + DTOs
8. ✅ AddFase use case
9. ✅ UpdateFase use case
10. ✅ ProofPointController + DTOs
11. ✅ AddProofPoint use case

### Día 3 - Exercises & Testing (2 hours)
12. ✅ ExerciseTemplateController
13. ✅ ExerciseInstanceController
14. ✅ Additional exercise use cases
15. ✅ API testing
16. ✅ Documentation review

---

## 🔧 Technical Decisions

### REST API Design
- RESTful conventions
- Nested resources donde apropiado
- Consistent response format
- HTTP status codes semánticos

### Validation Strategy
- class-validator decorators
- Transform DTOs automatically
- Whitelist unknown properties
- Custom validators cuando sea necesario

### Error Handling
- Domain errors → HTTP status codes
- Consistent error response format
- Logging de errores
- User-friendly messages

### Documentation
- Swagger UI en /api/docs
- @ApiProperty en todos los DTOs
- @ApiOperation en todos los endpoints
- Examples en documentación

---

## ✅ Checklist de Inicio

### Dependencies
- [ ] @nestjs/swagger installed
- [ ] swagger-ui-express installed
- [ ] class-validator installed
- [ ] class-transformer installed

### Configuration
- [ ] Swagger configured in main.ts
- [ ] Global validation pipe configured
- [ ] Global exception filter configured
- [ ] CORS configured

### Directories
- [ ] presentation/controllers/ created
- [ ] presentation/dtos/ created
- [ ] presentation/filters/ created
- [ ] presentation/interceptors/ created

---

## 📝 Notes

- Mantener controllers thin (solo routing y validation)
- Business logic en use cases
- Mapeo entre DTOs y domain en controllers
- Consistencia en nombres de endpoints
- Versioning API (v1)

---

**Estado Actual**: 📝 Plan Completo
**Próximo Paso**: Instalar dependencias y configurar Swagger
**Progreso General**: 75% → 90% (target)
