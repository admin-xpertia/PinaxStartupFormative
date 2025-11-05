# Fase 4: Checklist de Implementación

## Estado: ✅ BACKEND COMPLETO | ⏳ FRONTEND PENDIENTE

---

## 1. ✅ Esquema de Base de Datos

### ✅ Tabla `rubrica_evaluacion`
- **Ubicación**: `packages/database/schema/contenido.surql` (líneas 339-358)
- **Campos**:
  - ✅ `componente` (record<componente>)
  - ✅ `dimensiones` (array)
  - ✅ `pesos_validados` (bool)
  - ✅ `created_at`, `updated_at` (datetime)
- **Índices**: ✅ `rubricaCompIdx`

### ✅ Tabla `version_contenido`
- **Ubicación**: `packages/database/schema/versiones.surql` (líneas 12-47)
- **Campos**:
  - ✅ `componente` (record<componente>)
  - ✅ `numero_version` (int)
  - ✅ `contenido_snapshot` (object)
  - ✅ `cambios_descripcion` (string)
  - ✅ `tipo_cambio` (string: 'mayor', 'menor', 'patch', 'revision')
  - ✅ `creado_por` (record<user>)
  - ✅ `checksum` (string - MD5)
  - ✅ `tags` (array)
  - ✅ `created_at` (datetime)
- **Índices**: ✅ `versionContCompIdx`, `versionContNumIdx`

### ✅ Tabla `prompt_template`
- **Ubicación**: `packages/database/schema/generacion.surql` (líneas 151-172)
- **Campos**:
  - ✅ `nombre` (string)
  - ✅ `descripcion` (string)
  - ✅ `tipo_componente` (string: 'leccion', 'cuaderno', 'simulacion', 'herramienta')
  - ✅ `prompt_template` (string)
  - ✅ `config_default` (object)
  - ✅ `autor` (string)
  - ✅ `es_oficial` (bool)
  - ✅ `creador` (record<user>)
  - ✅ `created_at` (datetime)

---

## 2. ✅ API de Edición de Contenido con Versionamiento

### ✅ DTOs
- **Ubicación**: `apps/api/src/domains/programas/dto/update-contenido.dto.ts`
- ✅ `UpdateContenidoDto` con validaciones

### ✅ Controlador (Enfoque 1: tradicional)
- **Ubicación**: `apps/api/src/domains/contenido/contenido.controller.ts`
- ✅ `POST /contenido/editar` - Edita contenido con versionamiento
- ✅ `POST /contenido/publicar` - Publica contenido
- ✅ `POST /contenido/restaurar` - Restaura versión
- ✅ `GET /contenido/historial/:componenteId` - Historial de versiones
- ✅ `GET /contenido/comparar` - Compara versiones

### ✅ Controlador (Enfoque 2: según especificación)
- **Ubicación**: `apps/api/src/domains/programas/componentes.controller.ts`
- ✅ `GET /componentes/:id/contenido` - Carga datos para el editor
- ✅ `PUT /componentes/:id/contenido` - Guarda datos con versionamiento
- ✅ `GET /componentes/:componenteId/rubrica` - Obtiene rúbrica
- ✅ `POST /componentes/:componenteId/rubrica` - Crea rúbrica

### ✅ Servicios
- **Ubicación**: `apps/api/src/domains/programas/componentes.service.ts`
- ✅ `getContenidoActual(componenteId)` - Obtiene contenido actual
- ✅ `updateContenidoConVersionamiento(componenteId, nuevoContenido, userId)` - Actualiza con versionamiento
  - ✅ Crea snapshot antes de actualizar
  - ✅ Usa transacciones de SurrealDB
  - ✅ Marca como 'draft' automáticamente
  - ✅ Calcula número de versión secuencial

- **Ubicación**: `apps/api/src/domains/contenido/contenido-edicion.service.ts`
- ✅ `editarContenido(dto, userId)` - Edición con lógica de versionamiento
- ✅ `publicarContenido(dto, userId)` - Publicación de contenido
- ✅ `restaurarVersion(dto, userId)` - Restauración de versiones
- ✅ `obtenerHistorialVersiones(componenteId)` - Lista versiones
- ✅ `compararVersiones(versionAnteriorId, versionNuevaId, userId)` - Comparación

---

## 3. ✅ API para Rúbricas

### ✅ DTOs con Validador Customizado
- **Ubicación**: `apps/api/src/domains/contenido/dto/rubrica.dto.ts`
- ✅ `DescriptorDto` - Descriptor de nivel de logro
- ✅ `DimensionDto` - Dimensión de evaluación
- ✅ `CrearRubricaDto` - Con validador customizado `@Validate(PesoTotalValidator)`
- ✅ `ValidarPesosDto` - Para validación de pesos

### ✅ Validador Customizado
- **Ubicación**: `apps/api/src/domains/contenido/validators/peso-total.validator.ts`
- ✅ `PesoTotalValidator` - Valida que los pesos sumen 100
- ✅ Margen de error: 0.01
- ✅ Mensajes de error descriptivos

### ✅ Controlador de Rúbricas
- **Ubicación**: `apps/api/src/domains/contenido/contenido.controller.ts`
- ✅ `POST /contenido/rubrica` - Crea rúbrica (con validación automática)
- ✅ `GET /contenido/rubrica/:componenteId` - Obtiene rúbrica
- ✅ `PUT /contenido/rubrica/:rubricaId` - Actualiza rúbrica
- ✅ `DELETE /contenido/rubrica/:rubricaId` - Elimina rúbrica
- ✅ `POST /contenido/rubrica/validar` - Valida pesos
- ✅ `POST /contenido/rubrica/evaluar/:componenteId` - Evalúa con rúbrica

### ✅ Servicio de Rúbricas
- **Ubicación**: `apps/api/src/domains/contenido/rubrica.service.ts`
- ✅ `crearRubrica(dto)` - Crea rúbrica con validaciones
- ✅ `obtenerRubrica(componenteId)` - Obtiene rúbrica
- ✅ `actualizarRubrica(rubricaId, dto)` - Actualiza rúbrica
- ✅ `eliminarRubrica(rubricaId)` - Elimina rúbrica
- ✅ `validarPesos(dto)` - Valida suma de pesos
- ✅ `evaluarConRubrica(componenteId, evaluacion)` - Evalúa y calcula puntaje ponderado

---

## 4. ⏳ Frontend: UI para Rúbricas

### ⏳ Crear `rubrica-editor.tsx`
- **Ubicación esperada**: `apps/instructor-app/components/fase3/rubrica-editor.tsx`
- ⏳ Componente de React para editar rúbricas
- ⏳ Usar `useSWR` para cargar rúbrica existente
- ⏳ Permitir añadir/eliminar dimensiones dinámicamente
- ⏳ Campos por dimensión: `nombre` (string), `peso` (number)
- ⏳ Mostrar "Total: X / 100" en tiempo real
- ⏳ Habilitar botón "Guardar" solo si total === 100
- ⏳ Llamar a `POST /componentes/:componenteId/rubrica` o `PUT /rubricas/:rubricaId`

### ⏳ Integrar en Editores
- **Ubicación**: `apps/instructor-app/components/fase3/`
- ⏳ `lesson-editor.tsx` - Añadir botón "Gestionar Rúbrica"
- ⏳ `notebook-editor.tsx` - Añadir botón "Gestionar Rúbrica"
- ⏳ `simulation-editor.tsx` - Añadir botón "Gestionar Rúbrica"
- ⏳ `tool-editor.tsx` - Añadir botón "Gestionar Rúbrica"

---

## 5. ✅ API para `PromptTemplate` (Biblioteca)

### ✅ DTOs
- **Ubicación**: `apps/api/src/domains/generacion/dto/prompt-template.dto.ts`
- ✅ `CrearPromptTemplateDto` - Para crear plantillas
- ✅ `ActualizarPromptTemplateDto` - Para actualizar plantillas
- ✅ `BuscarPromptTemplatesDto` - Para buscar con filtros

### ✅ Controlador
- **Ubicación**: `apps/api/src/domains/generacion/prompt-template.controller.ts`
- ✅ `GET /prompt-templates` - Lista plantillas (con filtros)
- ✅ `POST /prompt-templates` - Crea plantilla
- ✅ `GET /prompt-templates/:id` - Obtiene plantilla
- ✅ `PUT /prompt-templates/:id` - Actualiza plantilla
- ✅ `DELETE /prompt-templates/:id` - Elimina plantilla
- ✅ `POST /prompt-templates/:id/renderizar` - Renderiza plantilla
- ✅ `POST /prompt-templates/:id/clonar` - Clona plantilla

### ✅ Servicio
- **Ubicación**: `apps/api/src/domains/generacion/prompt-template.service.ts`
- ✅ `crearPlantilla(dto, userId)` - Crea plantilla con validación de variables
- ✅ `buscarPlantillas(filtros)` - Busca con filtros (tipo_componente, es_oficial)
- ✅ `obtenerPlantilla(plantillaId)` - Obtiene plantilla específica
- ✅ `actualizarPlantilla(plantillaId, dto, userId)` - Actualiza plantilla
- ✅ `eliminarPlantilla(plantillaId, userId)` - Elimina plantilla (protege oficiales)
- ✅ `renderizarPlantilla(plantillaId, variables)` - Reemplaza `{{ variable }}`
- ✅ `clonarPlantilla(plantillaId, userId, nuevoNombre)` - Clona plantilla

### ✅ Validaciones de Plantillas
- ✅ Validación de sintaxis de variables `{{ variable }}`
- ✅ Detección de variables malformadas
- ✅ Extracción de variables del prompt
- ✅ Advertencia de variables sin reemplazar

---

## 6. ⏳ Frontend: Integración Final

### ⏳ Editores de Contenido
- **Ubicación**: `apps/instructor-app/components/fase3/`
- ⏳ `lesson-editor.tsx`:
  - ⏳ Usar `useSWR` para `GET /componentes/:id/contenido`
  - ⏳ Conectar botón "Guardar" a `PUT /componentes/:id/contenido`
  - ⏳ Añadir botón "Gestionar Rúbrica" que abra `rubrica-editor.tsx`
- ⏳ `notebook-editor.tsx`: (mismo flujo)
- ⏳ `simulation-editor.tsx`: (mismo flujo)
- ⏳ `tool-editor.tsx`: (mismo flujo)

### ⏳ Biblioteca de Plantillas
- **Ubicación**: `apps/instructor-app/components/fase3/template-library.tsx`
- ⏳ Reemplazar `mockTemplates` con `useSWR` a `GET /prompt-templates`
- ⏳ Conectar botón "Crear" a `POST /prompt-templates`
- ⏳ Conectar botón "Editar" a `PUT /prompt-templates/:id`
- ⏳ Conectar botón "Eliminar" a `DELETE /prompt-templates/:id`
- ⏳ Añadir función de clonar plantillas

---

## Extras Implementados (No en especificación original)

### ✅ Tablas Adicionales de Versionamiento
- ✅ `cambio_contenido` - Log de cambios detallado
- ✅ `comparacion_version` - Historial de comparaciones
- ✅ `rollback_historia` - Registro de rollbacks
- ✅ `aprobacion_version` - Flujo de aprobación
- ✅ `conflicto_version` - Detección de conflictos

### ✅ Funcionalidades Extra
- ✅ Comparación de versiones con diff
- ✅ Restauración de versiones con registro
- ✅ Evaluación con rúbricas (cálculo de puntajes)
- ✅ Clonación de plantillas
- ✅ Renderización de plantillas con variables

---

## Seguridad y Permisos (Pendiente)

### ⏳ Guards de Autenticación
- ⏳ Descomentar `@UseGuards(JwtAuthGuard)` en todos los controladores
- ⏳ Implementar `ProgramOwnershipGuard` para verificar propiedad del programa
- ⏳ Verificar que solo el creador puede editar/eliminar plantillas
- ⏳ Verificar que solo admins pueden gestionar plantillas oficiales

### ⏳ Validación de Roles
- ⏳ Solo instructores pueden editar contenido
- ⏳ Solo admins pueden aprobar versiones
- ⏳ Solo admins pueden gestionar plantillas oficiales

---

## Testing (Pendiente)

### ⏳ Tests Unitarios
- ⏳ `ComponentesService.spec.ts`
- ⏳ `RubricaService.spec.ts`
- ⏳ `PromptTemplateService.spec.ts`
- ⏳ `PesoTotalValidator.spec.ts`

### ⏳ Tests de Integración
- ⏳ `ComponentesController.spec.ts` (E2E)
- ⏳ `RubricaController.spec.ts` (E2E)
- ⏳ `PromptTemplateController.spec.ts` (E2E)

---

## Documentación

### ✅ Documentación de API
- ✅ `FASE-4-API-EDICION-CONTENIDO.md` - Documentación completa
- ✅ Ejemplos de uso de todos los endpoints
- ✅ Diagramas de flujo de versionamiento
- ✅ Guía de integración frontend

### ⏳ Documentación Swagger/OpenAPI
- ⏳ Generar docs Swagger automáticamente
- ⏳ Añadir decoradores `@ApiTags`, `@ApiOperation`, etc.

---

## Próximos Pasos Recomendados

1. **Frontend (Alta Prioridad)**:
   - Implementar `rubrica-editor.tsx`
   - Integrar editores con endpoints de contenido
   - Actualizar `template-library.tsx`

2. **Seguridad (Alta Prioridad)**:
   - Descomentar guards de autenticación
   - Implementar verificación de permisos

3. **Testing (Media Prioridad)**:
   - Crear tests unitarios
   - Crear tests de integración

4. **Documentación (Media Prioridad)**:
   - Generar Swagger docs
   - Crear guía de usuario

5. **Mejoras Futuras (Baja Prioridad)**:
   - Implementar flujo de aprobación
   - Implementar detección de conflictos
   - Añadir evaluación automática con IA
