# Guía de Pruebas - API de Autenticación

Esta guía te ayudará a probar los endpoints de autenticación de la API.

## Prerequisitos

1. **SurrealDB corriendo**:
   ```bash
   surreal start --user root --pass root file:data.db
   ```

2. **Esquema inicializado**:
   ```bash
   cd packages/database
   ./init-schema.sh
   ```

3. **API corriendo**:
   ```bash
   cd apps/api
   pnpm install
   pnpm dev
   ```

La API debería estar en `http://localhost:3000/api/v1`

---

## 🧪 Pruebas con cURL

### 1. Registrar un Nuevo Instructor

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@instructor.com",
    "nombre": "Instructor de Prueba",
    "password": "Password123!"
  }'
```

**Respuesta esperada** (201 Created):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 1209600,
  "user": {
    "id": "user:xxxxxxxxx",
    "email": "test@instructor.com",
    "nombre": "Instructor de Prueba",
    "rol": "instructor"
  }
}
```

### 2. Intentar Registrar con el Mismo Email (debe fallar)

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@instructor.com",
    "nombre": "Otro Instructor",
    "password": "Password456!"
  }'
```

**Respuesta esperada** (409 Conflict):
```json
{
  "statusCode": 409,
  "message": "El email ya está registrado",
  "error": "Conflict"
}
```

### 3. Iniciar Sesión

```bash
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@instructor.com",
    "password": "Password123!"
  }'
```

**Respuesta esperada** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 1209600,
  "user": {
    "id": "user:xxxxxxxxx",
    "email": "test@instructor.com",
    "nombre": "Instructor de Prueba",
    "rol": "instructor"
  }
}
```

### 4. Iniciar Sesión con Contraseña Incorrecta (debe fallar)

```bash
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@instructor.com",
    "password": "WrongPassword!"
  }'
```

**Respuesta esperada** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Email o contraseña incorrectos",
  "error": "Unauthorized"
}
```

### 5. Acceder a Ruta Protegida con Token

Primero, guarda el token de signin:
```bash
TOKEN="<tu-token-aquí>"
```

Luego, intenta acceder a una ruta protegida (cuando implementes más endpoints):
```bash
curl -X GET http://localhost:3000/api/v1/profile \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Acceder Sin Token (debe fallar)

```bash
curl -X GET http://localhost:3000/api/v1/profile
```

**Respuesta esperada** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Token no proporcionado",
  "error": "Unauthorized"
}
```

---

## 🧪 Pruebas con HTTPie

Si prefieres HTTPie (más legible):

### Signup
```bash
http POST http://localhost:3000/api/v1/auth/signup \
  email=test@instructor.com \
  nombre="Instructor de Prueba" \
  password=Password123!
```

### Signin
```bash
http POST http://localhost:3000/api/v1/auth/signin \
  email=test@instructor.com \
  password=Password123!
```

### Con Token
```bash
http GET http://localhost:3000/api/v1/profile \
  "Authorization: Bearer <token>"
```

---

## 🧪 Pruebas con Postman/Insomnia

### Configurar Postman

1. **Crear colección "Xpertia API"**

2. **Configurar variable de entorno**:
   - `base_url`: `http://localhost:3000/api/v1`
   - `token`: (se llenará automáticamente)

3. **Agregar requests**:

#### Signup
- Method: `POST`
- URL: `{{base_url}}/auth/signup`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "test@instructor.com",
  "nombre": "Instructor de Prueba",
  "password": "Password123!"
}
```
- Tests (para guardar token):
```javascript
if (pm.response.code === 201) {
    pm.environment.set("token", pm.response.json().token);
}
```

#### Signin
- Method: `POST`
- URL: `{{base_url}}/auth/signin`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "test@instructor.com",
  "password": "Password123!"
}
```
- Tests (para guardar token):
```javascript
if (pm.response.code === 200) {
    pm.environment.set("token", pm.response.json().token);
}
```

#### Ruta Protegida
- Method: `GET`
- URL: `{{base_url}}/profile`
- Headers: `Authorization: Bearer {{token}}`

---

## 🧪 Pruebas con Swagger UI

La forma más fácil es usar Swagger:

1. Abre `http://localhost:3000/docs` en tu navegador

2. **Prueba Signup**:
   - Expande `POST /auth/signup`
   - Click "Try it out"
   - Edita el body:
   ```json
   {
     "email": "swagger@test.com",
     "nombre": "Swagger Test",
     "password": "Test12345!"
   }
   ```
   - Click "Execute"
   - Copia el token de la respuesta

3. **Autorizar con el Token**:
   - Click en el botón "Authorize" arriba a la derecha
   - Pega el token (sin "Bearer", solo el token)
   - Click "Authorize"

4. **Prueba Signin**:
   - Expande `POST /auth/signin`
   - Click "Try it out"
   - Usa las mismas credenciales
   - Click "Execute"

5. **Prueba Rutas Protegidas**:
   - Ahora puedes probar cualquier ruta que requiera autenticación
   - El token se enviará automáticamente

---

## 🧪 Casos de Prueba Completos

### ✅ Caso 1: Flujo Exitoso de Registro

1. Signup con datos válidos → 201 + token
2. Usar token para acceder a ruta protegida → 200

### ✅ Caso 2: Validación de Email

1. Signup con email inválido → 400
   ```json
   { "email": "not-an-email", "nombre": "Test", "password": "Pass123!" }
   ```

### ✅ Caso 3: Validación de Password

1. Signup con password corto → 400
   ```json
   { "email": "test@test.com", "nombre": "Test", "password": "123" }
   ```

### ✅ Caso 4: Validación de Nombre

1. Signup con nombre muy corto → 400
   ```json
   { "email": "test@test.com", "nombre": "A", "password": "Pass123!" }
   ```

### ✅ Caso 5: Email Duplicado

1. Signup con email → 201
2. Signup con mismo email → 409

### ✅ Caso 6: Login con Credenciales Incorrectas

1. Signin con password incorrecta → 401
2. Signin con email que no existe → 401

### ✅ Caso 7: Token Inválido

1. Acceder a ruta protegida sin token → 401
2. Acceder con token malformado → 401
3. Acceder con token expirado → 401

### ✅ Caso 8: Flujo Completo

1. Signup → 201 + token1
2. Signin → 200 + token2
3. Usar token2 para acceder → 200
4. Signout → 204
5. Intentar usar token2 → 401

---

## 🧪 Script de Prueba Automatizado

Crea un archivo `test-auth.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"
EMAIL="test-$(date +%s)@test.com"

echo "🧪 Testing Authentication API"
echo "=============================="
echo ""

# 1. Signup
echo "1️⃣  Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"nombre\":\"Test User\",\"password\":\"Test12345!\"}")

TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.token')

if [ "$TOKEN" != "null" ]; then
  echo "   ✅ Signup successful"
  echo "   Token: ${TOKEN:0:20}..."
else
  echo "   ❌ Signup failed"
  echo "   Response: $SIGNUP_RESPONSE"
  exit 1
fi

echo ""

# 2. Signin
echo "2️⃣  Testing Signin..."
SIGNIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test12345!\"}")

SIGNIN_TOKEN=$(echo $SIGNIN_RESPONSE | jq -r '.token')

if [ "$SIGNIN_TOKEN" != "null" ]; then
  echo "   ✅ Signin successful"
else
  echo "   ❌ Signin failed"
  exit 1
fi

echo ""

# 3. Duplicate email
echo "3️⃣  Testing Duplicate Email..."
DUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"nombre\":\"Duplicate\",\"password\":\"Test12345!\"}")

if echo $DUP_RESPONSE | grep -q "409"; then
  echo "   ✅ Duplicate email rejected correctly"
else
  echo "   ❌ Duplicate email not rejected"
fi

echo ""

# 4. Wrong password
echo "4️⃣  Testing Wrong Password..."
WRONG_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"WrongPassword!\"}")

if echo $WRONG_RESPONSE | grep -q "401"; then
  echo "   ✅ Wrong password rejected correctly"
else
  echo "   ❌ Wrong password not rejected"
fi

echo ""
echo "=============================="
echo "✅ All tests passed!"
```

Ejecutar:
```bash
chmod +x test-auth.sh
./test-auth.sh
```

---

## 📊 Verificar en SurrealDB

También puedes verificar los datos directamente en SurrealDB:

```bash
surreal sql --endpoint http://localhost:8000 \
  --username root --password root \
  --namespace xpertia --database plataforma
```

```sql
-- Ver todos los usuarios
SELECT * FROM user;

-- Ver solo instructores
SELECT * FROM user WHERE rol = 'instructor';

-- Contar usuarios
SELECT count() FROM user;
```

---

## ✅ Checklist de Pruebas

- [ ] Signup con datos válidos → 201
- [ ] Signup con email duplicado → 409
- [ ] Signup con email inválido → 400
- [ ] Signup con password corta → 400
- [ ] Signup con nombre corto → 400
- [ ] Signin con credenciales válidas → 200
- [ ] Signin con password incorrecta → 401
- [ ] Signin con email inexistente → 401
- [ ] Acceder a ruta protegida con token → 200
- [ ] Acceder a ruta protegida sin token → 401
- [ ] Acceder a ruta protegida con token inválido → 401
- [ ] Signout invalida el token → 204

---

## 🐛 Troubleshooting

### Error: "Cannot connect to SurrealDB"
- Verifica que SurrealDB está corriendo
- Verifica las credenciales en `.env`

### Error: "No record was returned"
- El esquema no está inicializado
- Ejecuta `./init-schema.sh`

### Error: "Token inválido"
- El token puede haber expirado
- Genera un nuevo token con signin

### Error: 400 Bad Request
- Verifica que los datos cumplen con las validaciones
- Email debe ser válido
- Password mínimo 8 caracteres
- Nombre mínimo 2 caracteres

---

## 📝 Notas

- Los tokens de instructor duran **14 días**
- Las contraseñas se hashean con **Argon2**
- El email debe ser **único** en el sistema
- Solo usuarios con rol `instructor` o `admin` pueden autenticarse con `instructor_scope`

---

¡Listo para probar! 🚀
