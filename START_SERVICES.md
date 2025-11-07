# Cómo Iniciar los Servicios

## Problema Actual

El frontend muestra "Network Error" porque el backend no está corriendo.

## Solución

He creado los archivos de configuración necesarios:
- ✅ `apps/api/.env` - Configuración del backend con SurrealDB Cloud
- ✅ `apps/instructor-app/.env.local` - Configuración del frontend

## Pasos para Iniciar

### 1. Iniciar el Backend (API)

Abre una terminal y ejecuta:

```bash
cd apps/api

# Instalar dependencias si es necesario
pnpm install

# Iniciar en modo desarrollo
pnpm dev
```

Deberías ver:

```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] LOG [SurrealDbService] 🔧 Configuration:
[Nest] LOG [SurrealDbService]    URL: wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud
[Nest] LOG [SurrealDbService]    Namespace: StartupFormative
[Nest] LOG [SurrealDbService]    Database: Roadmap
[Nest] LOG [SurrealDbService] ✅ Conectado a SurrealDB...
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG Application is running on: http://localhost:3000
```

### 2. Iniciar el Frontend (Instructor App)

En **otra terminal**, ejecuta:

```bash
cd apps/instructor-app

# Instalar dependencias si es necesario
pnpm install

# Iniciar en modo desarrollo
pnpm dev
```

El frontend iniciará (probablemente en puerto 3001).

### 3. Verificar

1. Backend corriendo en: http://localhost:3000
2. Frontend corriendo en: http://localhost:3001 (o el puerto que Next.js asigne)
3. Swagger docs disponibles en: http://localhost:3000/api

## Configuración Aplicada

### Backend (`apps/api/.env`)

```env
PORT=3000
SURREAL_URL=wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud
SURREAL_NAMESPACE=StartupFormative
SURREAL_DATABASE=Roadmap
SURREAL_USER=root
SURREAL_PASS=xpertia123
CORS_ORIGIN=http://localhost:3001
```

### Frontend (`apps/instructor-app/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## Troubleshooting

### Si el backend no se conecta a SurrealDB:

Verifica que puedes acceder a:
```
wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud
```

### Si el frontend sigue con Network Error:

1. Verifica que el backend esté corriendo en puerto 3000
2. Abre la consola del navegador y revisa el error completo
3. Verifica que `NEXT_PUBLIC_API_URL` esté correctamente configurado

### Si hay error de CORS:

Verifica que `CORS_ORIGIN` en el backend coincida con el puerto del frontend.

## Probar la Autenticación

Una vez que ambos servicios estén corriendo:

1. Ve a http://localhost:3001/login
2. Ingresa credenciales:
   - Email: `instructor@xpertia.com`
   - Password: `Instructor123!`
3. Deberías poder iniciar sesión correctamente

Si todo funciona, podrás crear programas sin errores! 🎉
