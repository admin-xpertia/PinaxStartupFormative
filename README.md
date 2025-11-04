# Xpertia Plataforma

Plataforma educativa innovadora basada en Domain-Driven Design (DDD) con SurrealDB como base de datos.

## Arquitectura

Este es un monorepo que contiene todas las aplicaciones y paquetes compartidos de la plataforma Xpertia.

### Estructura del Proyecto

```
xpertia-plataforma/
├── apps/
│   ├── api/              # API Backend (NestJS)
│   └── instructor-app/   # Aplicación para Instructores (Next.js)
├── packages/
│   ├── database/         # Esquema SurrealDB y configuración
│   ├── types/           # Tipos TypeScript compartidos
│   └── ui-core/         # Componentes UI compartidos
└── README.md
```

## Stack Tecnológico

- **Base de Datos**: SurrealDB (modo SCHEMAFULL con Record Links)
- **Backend**: NestJS (TypeScript)
- **Frontend**: Next.js 14 (App Router, TypeScript)
- **Arquitectura**: Domain-Driven Design (DDD)
- **Monorepo**: Turborepo / pnpm workspaces

## Inicio Rápido

### Prerequisitos

1. **Node.js** 20+
2. **pnpm** 8+
3. **SurrealDB** 1.5+

### Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone <repo-url>
   cd xpertia-plataforma
   ```

2. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

3. **Instalar e iniciar SurrealDB**:
   ```bash
   # macOS/Linux
   curl -sSf https://install.surrealdb.com | sh

   # O con Homebrew
   brew install surrealdb/tap/surreal

   # Iniciar servidor
   surreal start --log trace --user root --pass root file:data.db
   ```

4. **Inicializar esquema de base de datos**:
   ```bash
   cd packages/database
   ./init-schema.sh
   ```

5. **Configurar variables de entorno**:
   ```bash
   # En apps/api
   cp apps/api/.env.example apps/api/.env

   # En apps/instructor-app
   cp apps/instructor-app/.env.example apps/instructor-app/.env
   ```

6. **Iniciar aplicaciones**:
   ```bash
   # Iniciar todo en modo desarrollo
   pnpm dev

   # O individualmente
   pnpm --filter @xpertia/api dev
   pnpm --filter instructor-app dev
   ```

## Paquetes

### `@xpertia/database`

Contiene el esquema completo de SurrealDB en modo SCHEMAFULL, organizados por dominios:

- **auth.surql**: Autenticación y usuarios
- **contenido.surql**: Programas, fases, proof points, niveles, componentes
- **generacion.surql**: Generación de contenido con IA
- **ejecucion.surql**: Estudiantes y progreso
- **portafolio.surql**: Portafolios y reportes
- **analytics.surql**: Métricas y telemetría
- **versiones.surql**: Versionamiento de contenido

[Ver documentación completa](./packages/database/README.md)

### `@xpertia/types`

Tipos TypeScript compartidos entre todas las aplicaciones, generados del esquema de base de datos.

### `@xpertia/ui-core`

Componentes UI compartidos basados en shadcn/ui y Tailwind CSS.

## Aplicaciones

### API Backend (`apps/api`)

API REST/GraphQL construida con NestJS siguiendo principios DDD:

- **Módulos por dominio**: Auth, Programas, Estudiantes, Analytics, etc.
- **Repositorios**: Abstracción de acceso a datos
- **Casos de uso**: Lógica de negocio encapsulada
- **DTOs**: Validación con class-validator

### Instructor App (`apps/instructor-app`)

Aplicación web para instructores construida con Next.js 14:

- **App Router**: Enrutamiento basado en archivos
- **Server Components**: Optimización de rendimiento
- **Autenticación**: JWT con SurrealDB SCOPE
- **UI**: shadcn/ui + Tailwind CSS

## Características Clave

### 1. Base de Datos SurrealDB

- **Modo SCHEMAFULL**: Validación de datos a nivel de BD
- **Record Links**: Relaciones tipo-safe entre tablas
- **Validaciones**: ASSERT para integridad de datos
- **Timestamps automáticos**: created_at / updated_at
- **Índices optimizados**: Para queries comunes

### 2. Domain-Driven Design

- **Bounded Contexts**: Separación clara de dominios
- **Aggregates**: Entidades y objetos de valor
- **Repositorios**: Abstracción de persistencia
- **Casos de Uso**: Lógica de negocio aislada

### 3. Arquitectura de Aprendizaje

```
Programa
  └─ Fase
      └─ ProofPoint
          └─ Nivel
              └─ Componente (Lección, Cuaderno, Simulación, Herramienta)
```

### 4. Generación con IA

- Generación de contenido educativo
- Validación automática de calidad
- Feedback personalizado para estudiantes
- Métricas de efectividad

### 5. Analytics y Detección de Fricción

- Telemetría en tiempo real
- Métricas por componente/cohorte
- Detección automática de puntos de fricción
- Alertas para instructores

## Scripts Disponibles

```bash
# Desarrollo
pnpm dev                    # Iniciar todas las apps en desarrollo
pnpm dev --filter api       # Iniciar solo API
pnpm dev --filter instructor-app  # Iniciar solo instructor-app

# Build
pnpm build                  # Build todas las apps
pnpm build --filter api     # Build solo API

# Testing
pnpm test                   # Ejecutar tests
pnpm test:e2e              # Ejecutar tests e2e

# Linting
pnpm lint                   # Lint todas las apps
pnpm lint:fix              # Lint y autofix

# Database
pnpm db:init               # Inicializar esquema
pnpm db:reset              # Resetear base de datos
pnpm db:query              # Abrir CLI de SurrealDB
```

## Base de Datos - Usuarios por Defecto

Después de inicializar el esquema, están disponibles:

- **Admin**: `admin@xpertia.com` / `changeme123!`
- **Instructor**: `instructor@xpertia.com` / `instructor123!`

⚠️ **IMPORTANTE**: Cambiar contraseñas en producción.

## Desarrollo

### Agregar una nueva tabla

1. Editar el archivo `.surql` correspondiente en `packages/database/schema/`
2. Agregar tipo en `packages/database/types.ts`
3. Ejecutar `cd packages/database && ./init-schema.sh`

### Agregar un nuevo dominio

1. Crear módulo en `apps/api/src/modules/<dominio>`
2. Implementar repositorio, casos de uso y controladores
3. Agregar rutas en el módulo principal

### Agregar nueva página en instructor-app

1. Crear ruta en `apps/instructor-app/app/<ruta>/page.tsx`
2. Implementar componentes en `apps/instructor-app/components/`
3. Agregar navegación si es necesario

## Contribuir

1. Fork el repositorio
2. Crear una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## Licencia

MIT

## Soporte

Para reportar problemas o solicitar características, crear un issue en el repositorio.

## Roadmap

- [x] **Definir esquema completo de SurrealDB** ✅
- [x] **Implementar API Backend con NestJS** ✅
- [x] **Implementar autenticación JWT nativa de SurrealDB** ✅
- [x] **Conectar instructor-app con API** ✅
- [x] **Protección de rutas en frontend** ✅
- [x] **Gestión de sesión completa** ✅
- [ ] Implementar CRUD de programas
- [ ] Implementar gestión de cohortes
- [ ] Implementar generación de contenido con IA
- [ ] Implementar sistema de analytics
- [ ] Desarrollar app para estudiantes
- [ ] Implementar sistema de portafolios
- [ ] Agregar tests e2e
- [ ] Preparar para producción

## Estado Actual: ✅ FASE 1 COMPLETADA

### ✨ Lo que está funcionando AHORA:

1. **Base de Datos**:
   - ✅ Esquema completo de 49 tablas en SurrealDB
   - ✅ Modo SCHEMAFULL con Record Links
   - ✅ 2 SCOPES: instructor_scope, estudiante_scope
   - ✅ Autenticación Argon2

2. **Backend API**:
   - ✅ NestJS con arquitectura DDD
   - ✅ SurrealDB integrado
   - ✅ 4 endpoints de autenticación funcionando
   - ✅ AuthGuard global
   - ✅ Swagger documentation en `/docs`

3. **Frontend**:
   - ✅ Next.js 14 con App Router
   - ✅ Páginas de login y signup
   - ✅ AuthProvider y useAuth hook
   - ✅ Protección automática de rutas
   - ✅ Header con datos reales del usuario
   - ✅ Logout funcional

4. **Sistema Completo**:
   - ✅ Login funciona end-to-end
   - ✅ Registro de nuevos instructores
   - ✅ Persistencia de sesión
   - ✅ Auto-logout en token inválido
   - ✅ Tokens JWT nativos de SurrealDB

### 📚 Documentación Disponible:

- **[GETTING_STARTED.md](./GETTING_STARTED.md)**: Guía para iniciar el proyecto
- **[SCHEMA_SUMMARY.md](./SCHEMA_SUMMARY.md)**: Resumen completo del esquema
- **[AUTHENTICATION_SUMMARY.md](./AUTHENTICATION_SUMMARY.md)**: Detalles de autenticación backend
- **[FRONTEND_AUTH_SUMMARY.md](./FRONTEND_AUTH_SUMMARY.md)**: Integración frontend
- **[apps/api/TESTING.md](./apps/api/TESTING.md)**: Guía de pruebas de API
