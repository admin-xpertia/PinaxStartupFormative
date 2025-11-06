# Base de Datos Lista para Pruebas

**Fecha:** 2025-11-06
**Estado:** ✅ Lista para testing del sistema de login

---

## Resumen

La base de datos ha sido **completamente limpiada** y reinicializada con solo las tablas esenciales de autenticación. Esto permite realizar pruebas del sistema de login sin interferencias de código legacy.

---

## Estado Actual

### SurrealDB Server
- **Status:** ✅ Ejecutándose
- **Endpoint:** `http://localhost:8000`
- **Namespace:** `xpertia`
- **Database:** `main`
- **Modo:** Memory (en memoria)
- **Auth:** Root user (root/root)

### Tablas Existentes

Solamente **2 tablas** en la base de datos:

1. **`user`** - Tabla de usuarios
   - Campos: id, email, nombre, password_hash, rol, preferencias, activo, created_at, updated_at
   - Permisos: SELECT (propio usuario), CREATE/UPDATE/DELETE (NONE)
   - Índice: email (UNIQUE)

2. **`session`** - Tabla de sesiones
   - Campos: id, user, token, ip_address, user_agent, expires_at, created_at, last_activity
   - Permisos: SELECT/UPDATE/DELETE (propio usuario), CREATE (autenticado)
   - Índices: token (UNIQUE), user

### ✅ Tablas Legacy Eliminadas

Las siguientes tablas del sistema antiguo **NO existen**:
- ❌ `nivel`
- ❌ `componente`
- ❌ `prerequisitos_componente`
- ❌ `progreso_nivel`
- ❌ `progreso_componente`
- ❌ `datos_estudiante`
- ❌ `evaluacion_resultado`
- ❌ `feedback_generado`
- ❌ Todas las tablas `snapshot_*` (7 tablas)

---

## Usuarios de Prueba

Se han creado **3 usuarios** con contraseñas por defecto:

### 1. Administrador
```
Email:    admin@xpertia.com
Password: changeme123!
Rol:      admin
ID:       user:admin
```

### 2. Instructor
```
Email:    instructor@xpertia.com
Password: instructor123!
Rol:      instructor
ID:       user:instructor
```

### 3. Estudiante
```
Email:    estudiante@xpertia.com
Password: estudiante123!
Rol:      estudiante
ID:       user:estudiante
```

---

## Verificación

### Query para verificar usuarios:
```sql
SELECT id, email, rol, nombre, activo FROM user;
```

**Resultado esperado:**
```json
[
  { "id": "user:admin", "email": "admin@xpertia.com", "rol": "admin", "nombre": "Administrator", "activo": true },
  { "id": "user:estudiante", "email": "estudiante@xpertia.com", "rol": "estudiante", "nombre": "Estudiante Demo", "activo": true },
  { "id": "user:instructor", "email": "instructor@xpertia.com", "rol": "instructor", "nombre": "Instructor Demo", "activo": true }
]
```

### Query para verificar tablas:
```sql
INFO FOR DB;
```

**Tablas esperadas:** Solo `user` y `session`

---

## Pruebas del Sistema de Login

### 1. Prueba de Login Exitoso

**API Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "admin@xpertia.com",
  "password": "changeme123!"
}
```

**Expected Response (200 OK):**
```json
{
  "user": {
    "id": "user:admin",
    "email": "admin@xpertia.com",
    "nombre": "Administrator",
    "rol": "admin"
  },
  "token": "...",
  "expiresAt": "..."
}
```

### 2. Prueba de Login Fallido

**Request Body:**
```json
{
  "email": "admin@xpertia.com",
  "password": "wrongpassword"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

### 3. Prueba de Usuario No Existe

**Request Body:**
```json
{
  "email": "noexiste@xpertia.com",
  "password": "anypassword"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

### 4. Prueba de Sesión

Después de login exitoso, verificar que se creó una sesión:

```sql
SELECT * FROM session WHERE user = user:admin;
```

---

## Comandos Útiles

### Conectar a SurrealDB CLI
```bash
surreal sql \
  --endpoint http://localhost:8000 \
  --namespace xpertia \
  --database main \
  --auth-level root \
  --username root \
  --password root
```

### Ver todas las tablas
```sql
INFO FOR DB;
```

### Ver usuarios
```sql
SELECT * FROM user;
```

### Ver sesiones activas
```sql
SELECT * FROM session;
```

### Limpiar sesiones
```sql
DELETE session;
```

### Verificar password hash
```sql
-- Verificar que el password está hasheado correctamente
SELECT password_hash FROM user WHERE email = 'admin@xpertia.com';
```

---

## Detener SurrealDB

Cuando termines las pruebas:

```bash
# Encontrar el PID
cat /tmp/surrealdb.pid

# Detener el proceso
kill $(cat /tmp/surrealdb.pid)

# O buscar y matar manualmente
ps aux | grep surreal
kill <PID>
```

---

## Notas Importantes

⚠️ **Base de Datos en Memoria:**
- Los datos se perderán al detener SurrealDB
- Esto es intencional para pruebas
- Para persistencia, usar `file:` o `rocksdb:` en lugar de `memory`

⚠️ **Contraseñas por Defecto:**
- Las contraseñas listadas son para desarrollo/testing
- **NUNCA** usar estas contraseñas en producción
- Cambiar inmediatamente en entorno productivo

✅ **Estado Limpio:**
- No hay tablas legacy
- No hay datos de programas/fases/ejercicios
- Solo autenticación funcional
- Ideal para testing aislado del sistema de login

---

## Próximos Pasos

1. ✅ Verificar que SurrealDB está corriendo
2. ✅ Confirmar que solo existen tablas `user` y `session`
3. ✅ Probar login con usuarios de prueba
4. 🔄 Desarrollar tests automatizados de autenticación
5. 🔄 Implementar refresh tokens (si aplica)
6. 🔄 Agregar tablas del nuevo sistema de ejercicios cuando esté listo

---

## Troubleshooting

### SurrealDB no responde
```bash
# Verificar que está corriendo
ps aux | grep surreal

# Verificar puerto
lsof -i :8000

# Reiniciar si es necesario
kill $(cat /tmp/surrealdb.pid)
surreal start --log trace --user root --pass root memory &
```

### Usuarios no existen
```bash
# Reimportar schema
surreal import \
  --endpoint http://localhost:8000 \
  --namespace xpertia \
  --database main \
  --username root \
  --password root \
  packages/database/temp_init.surql
```

### Password no funciona
- Verificar que usas `crypto::argon2::compare()` en el backend
- Los passwords están hasheados con Argon2
- Nunca compares passwords en texto plano

---

**¡Base de datos lista para pruebas! 🚀**

*Última actualización: 2025-11-06*
