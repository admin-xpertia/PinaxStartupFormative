# Xpertia API

API Backend para la plataforma educativa Xpertia, construida con NestJS y SurrealDB.

## Características

- **Framework**: NestJS con TypeScript
- **Base de Datos**: SurrealDB con autenticación nativa
- **Arquitectura**: Domain-Driven Design (DDD)
- **Validación**: class-validator y class-transformer
- **Documentación**: Swagger/OpenAPI
- **Autenticación**: JWT nativo de SurrealDB con SCOPES

## Estructura del Proyecto

```
apps/api/
├── src/
│   ├── core/                    # Módulos core y compartidos
│   │   ├── database/           # SurrealDB module y service
│   │   ├── guards/             # Guards de autenticación
│   │   └── decorators/         # Decoradores personalizados
│   ├── domains/                # Dominios de negocio (DDD)
│   │   └── usuarios/          # Dominio de usuarios
│   │       ├── dto/           # Data Transfer Objects
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       └── usuarios.module.ts
│   ├── app.module.ts          # Módulo principal
│   └── main.ts                # Entry point
├── test/                       # Tests
├── .env                        # Variables de entorno
├── .env.example               # Ejemplo de configuración
├── nest-cli.json              # Configuración de NestJS CLI
├── package.json
├── tsconfig.json
└── README.md
```

## Instalación

1. **Instalar dependencias**:
   ```bash
   cd apps/api
   pnpm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

3. **Asegurarse de que SurrealDB está corriendo**:
   ```bash
   surreal start --log trace --user root --pass root file:data.db
   ```

4. **Inicializar el esquema de base de datos** (si no lo has hecho):
   ```bash
   cd ../../packages/database
   ./init-schema.sh
   cd ../../apps/api
   ```

## Scripts Disponibles

```bash
# Desarrollo
pnpm dev                # Iniciar en modo desarrollo con hot-reload

# Build
pnpm build              # Compilar para producción

# Producción
pnpm start:prod         # Iniciar en modo producción

# Testing
pnpm test               # Ejecutar tests unitarios
pnpm test:watch         # Ejecutar tests en modo watch
pnpm test:cov           # Ejecutar tests con coverage
pnpm test:e2e           # Ejecutar tests e2e

# Linting
pnpm lint               # Lint del código
pnpm format             # Formatear código con Prettier
```

## API Endpoints

### Autenticación

#### POST /api/v1/auth/signup
Registra un nuevo instructor.

**Request Body**:
```json
{
  "email": "instructor@example.com",
  "nombre": "Juan Pérez",
  "password": "Password123!"
}
```

**Response** (201 Created):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 1209600,
  "user": {
    "id": "user:abc123",
    "email": "instructor@example.com",
    "nombre": "Juan Pérez",
    "rol": "instructor"
  }
}
```

**Errores**:
- `400 Bad Request`: Datos de entrada inválidos
- `409 Conflict`: El email ya está registrado

#### POST /api/v1/auth/signin
Inicia sesión de un instructor.

**Request Body**:
```json
{
  "email": "instructor@example.com",
  "password": "Password123!"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 1209600,
  "user": {
    "id": "user:abc123",
    "email": "instructor@example.com",
    "nombre": "Juan Pérez",
    "rol": "instructor"
  }
}
```

**Errores**:
- `400 Bad Request`: Datos de entrada inválidos
- `401 Unauthorized`: Credenciales incorrectas o usuario inactivo

#### POST /api/v1/auth/signout
Cierra sesión (invalida el token).

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (204 No Content)

## Autenticación

La API utiliza **JWT tokens** generados nativamente por SurrealDB a través de SCOPES.

### Cómo Autenticar Requests

1. Obtén un token mediante `/auth/signup` o `/auth/signin`
2. Incluye el token en el header de tus requests:
   ```
   Authorization: Bearer <tu-token>
   ```

### Rutas Públicas

Las rutas de autenticación (`/auth/signup`, `/auth/signin`) son públicas y no requieren token.

Para marcar otras rutas como públicas, usa el decorador `@Public()`:

```typescript
import { Public } from '@core/decorators';

@Public()
@Get('health')
getHealth() {
  return { status: 'ok' };
}
```

### Obtener Usuario Actual

Usa el decorador `@User()` para obtener el usuario autenticado:

```typescript
import { User } from '@core/decorators';

@Get('profile')
getProfile(@User() user: any) {
  return user;
}

// Obtener solo el email
@Get('email')
getEmail(@User('email') email: string) {
  return { email };
}
```

## Swagger Documentation

La documentación de la API está disponible en:

```
http://localhost:3000/docs
```

Incluye:
- Esquemas de todos los endpoints
- Ejemplos de requests/responses
- Autenticación con token Bearer
- Probador interactivo de API

## Configuración de SurrealDB

La conexión a SurrealDB se gestiona mediante el `SurrealDbModule` en `src/core/database/`.

### Variables de Entorno

```env
SURREAL_URL=http://localhost:8000
SURREAL_NAMESPACE=xpertia
SURREAL_DATABASE=plataforma
SURREAL_USER=root
SURREAL_PASS=root
```

### SCOPES Disponibles

- **instructor_scope**: Para instructores y administradores (sesión de 14 días)
- **estudiante_scope**: Para estudiantes (sesión de 30 días)

## Manejo de Errores

La API implementa manejo robusto de errores:

### Errores Comunes

- `400 Bad Request`: Datos de entrada inválidos (validación fallida)
- `401 Unauthorized`: Token inválido, expirado o no proporcionado
- `403 Forbidden`: Permisos insuficientes
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto (ej. email duplicado)
- `500 Internal Server Error`: Error del servidor

### Formato de Error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Development

### Agregar un Nuevo Endpoint

1. Crear DTO en `src/domains/{dominio}/dto/`
2. Implementar lógica en el servicio
3. Crear endpoint en el controlador
4. Agregar documentación con decoradores de Swagger

### Agregar un Nuevo Dominio

1. Crear carpeta `src/domains/{nuevo-dominio}/`
2. Crear módulo, controlador y servicio
3. Importar módulo en `app.module.ts`

## Testing

```bash
# Tests unitarios
pnpm test

# Tests con coverage
pnpm test:cov

# Tests e2e
pnpm test:e2e
```

## Deployment

### Build para Producción

```bash
pnpm build
```

### Ejecutar en Producción

```bash
pnpm start:prod
```

### Variables de Entorno en Producción

Asegúrate de configurar:
- `NODE_ENV=production`
- Credenciales seguras para SurrealDB
- CORS origin apropiado
- Puerto y API prefix si es necesario

## Troubleshooting

### Error al conectar con SurrealDB

Verifica que:
1. SurrealDB está corriendo
2. Las credenciales son correctas
3. El namespace y database existen

### Error "Token inválido"

El token puede haber expirado. Tokens de instructores duran 14 días.

### Error "Email ya está registrado"

El email ya existe en la base de datos. Usa `/auth/signin` en su lugar.

## Recursos

- [NestJS Documentation](https://docs.nestjs.com/)
- [SurrealDB Documentation](https://surrealdb.com/docs)
- [SurrealDB.js](https://surrealdb.com/docs/integration/libraries/javascript)
- [Class Validator](https://github.com/typestack/class-validator)
- [Swagger](https://swagger.io/)

## Licencia

MIT
