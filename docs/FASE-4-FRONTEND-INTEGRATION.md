# Fase 4: Guía de Integración Frontend

## Componentes Implementados

### 1. RubricaEditor

**Ubicación**: `apps/instructor-app/components/fase3/rubrica-editor.tsx`

Componente modal para crear y editar rúbricas de evaluación con validación en tiempo real.

#### Características:
- ✅ Agregar/eliminar dimensiones dinámicamente
- ✅ Agregar/eliminar descriptores por dimensión
- ✅ Validación en tiempo real del peso total (debe sumar 100)
- ✅ Indicador visual de validez
- ✅ Integración con API (`GET /componentes/:id/rubrica`, `POST /componentes/:id/rubrica`)
- ✅ Auto-guardado con revalidación SWR

#### Uso:

```tsx
import { RubricaEditor } from '@/components/fase3/rubrica-editor';

function MiComponente() {
  const [showRubrica, setShowRubrica] = useState(false);

  return (
    <>
      <Button onClick={() => setShowRubrica(true)}>
        Gestionar Rúbrica
      </Button>

      <RubricaEditor
        componenteId="componente:123"
        open={showRubrica}
        onOpenChange={setShowRubrica}
      />
    </>
  );
}
```

#### Estructura de Datos:

```typescript
interface Rubrica {
  id?: string;
  componenteId: string;
  dimensiones: Dimension[];
  pesosValidados: boolean;
}

interface Dimension {
  nombre: string;
  peso: number; // 0-100, debe sumar 100 entre todas
  descriptores: Descriptor[];
}

interface Descriptor {
  nivel: string; // ej. "Excelente", "Bueno", "Regular"
  puntos: number; // 0-100
  descripcion: string; // Criterio observable
}
```

---

### 2. LessonEditorIntegrated

**Ubicación**: `apps/instructor-app/components/fase3/lesson-editor-integrated.tsx`

Editor de lecciones completamente integrado con la API de contenido y versionamiento.

#### Características:
- ✅ Carga contenido desde `GET /componentes/:id/contenido`
- ✅ Guardado automático cada 30 segundos
- ✅ Guardado manual con `PUT /componentes/:id/contenido`
- ✅ Publicación de contenido
- ✅ Indicador de estado (Borrador/Publicado)
- ✅ Indicador de cambios sin guardar
- ✅ Botón "Gestionar Rúbrica" integrado
- ✅ Vista previa en tiempo real
- ✅ Cálculo automático de metadata (palabras, tiempo de lectura)

#### Uso:

```tsx
import { LessonEditorIntegrated } from '@/components/fase3/lesson-editor-integrated';

function PaginaEditarLeccion() {
  return (
    <LessonEditorIntegrated
      componenteId="componente:123"
      componenteNombre="Introducción a TypeScript"
      onClose={() => router.back()}
    />
  );
}
```

#### Estados:
- **Cargando**: Muestra spinner mientras carga el contenido
- **Error**: Muestra mensaje de error si falla la carga
- **Sin guardar**: Badge amarillo con ícono de alerta
- **Guardando**: Spinner con texto "Guardando..."
- **Guardado**: Check verde con texto "Guardado"

---

### 3. TemplateLibraryIntegrated

**Ubicación**: `apps/instructor-app/components/fase3/template-library-integrated.tsx`

Biblioteca de plantillas de prompts completamente integrada con la API.

#### Características:
- ✅ Listado de plantillas desde `GET /prompt-templates`
- ✅ Filtros por tipo de componente
- ✅ Filtro "Solo oficiales"
- ✅ Búsqueda en tiempo real
- ✅ CRUD completo:
  - Crear nueva plantilla
  - Editar plantilla (solo creador)
  - Eliminar plantilla (solo creador, no oficiales)
  - Clonar plantilla
- ✅ Vista expandida con prompt y configuración
- ✅ Selección de plantilla para uso

#### Uso:

```tsx
import { TemplateLibraryIntegrated } from '@/components/fase3/template-library-integrated';

// Como página completa
function PaginaBiblioteca() {
  return (
    <div className="h-screen">
      <TemplateLibraryIntegrated />
    </div>
  );
}

// Como modal con selección
function ComponenteConModal() {
  const [showLibrary, setShowLibrary] = useState(false);

  const handleSelectTemplate = (template: PromptTemplate) => {
    console.log('Plantilla seleccionada:', template);
    // Usar la plantilla para generar contenido
    setShowLibrary(false);
  };

  return (
    <>
      <Button onClick={() => setShowLibrary(true)}>
        Seleccionar Plantilla
      </Button>

      <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <TemplateLibraryIntegrated
            onSelectTemplate={handleSelectTemplate}
            tipoComponenteFiltro="leccion"
            isModal={true}
            onClose={() => setShowLibrary(false)}
          </DialogContent>
        </Dialog>
      </Button>
    </>
  );
}
```

---

## Hooks Personalizados

### Hooks de Contenido

**Ubicación**: `apps/instructor-app/lib/hooks/use-contenido.ts`

#### `useContenido(componenteId)`
Carga el contenido actual de un componente.

```tsx
const { contenido, isLoading, error } = useContenido('componente:123');

// contenido.contenido = { markdown: "...", palabras_estimadas: 500, ... }
// contenido.estado = "draft" | "publicado"
```

#### `useGuardarContenido(componenteId)`
Guarda el contenido con versionamiento automático.

```tsx
const { guardarContenido, isGuardando } = useGuardarContenido('componente:123');

await guardarContenido({
  markdown: "<h1>Mi lección</h1>...",
  palabras_estimadas: 500,
  tiempo_lectura_minutos: 5,
});
```

#### `usePublicarContenido()`
Publica el contenido (draft → publicado).

```tsx
const { publicarContenido, isPublicando } = usePublicarContenido();

await publicarContenido(contenidoId);
```

#### `useHistorialVersiones(componenteId)`
Obtiene el historial de versiones.

```tsx
const { versiones, isLoading } = useHistorialVersiones('componente:123');

versiones.forEach(v => {
  console.log(`Versión ${v.numero_version}: ${v.cambios_descripcion}`);
});
```

#### `useRestaurarVersion()`
Restaura una versión anterior.

```tsx
const { restaurarVersion, isRestaurando } = useRestaurarVersion();

await restaurarVersion('componente:123', 'version_contenido:456', 'Rollback por error');
```

---

### Hooks de Plantillas

**Ubicación**: `apps/instructor-app/lib/hooks/use-prompt-templates.ts`

#### `usePromptTemplates(filtros)`
Lista plantillas con filtros opcionales.

```tsx
const { plantillas, isLoading, error } = usePromptTemplates({
  tipoComponente: 'leccion',
  esOficial: true,
});
```

#### `usePromptTemplate(plantillaId)`
Obtiene una plantilla específica.

```tsx
const { plantilla, isLoading, error } = usePromptTemplate('prompt_template:123');
```

#### `useCrearPlantilla()`
Crea una nueva plantilla.

```tsx
const { crearPlantilla, isCreando } = useCrearPlantilla();

await crearPlantilla({
  nombre: "Lección Académica",
  descripcion: "Para conceptos complejos",
  tipoComponente: "leccion",
  promptTemplate: "Genera una lección sobre {{ tema }}...",
  autor: "Mi Nombre",
});
```

#### `useActualizarPlantilla()`
Actualiza una plantilla existente.

```tsx
const { actualizarPlantilla, isActualizando } = useActualizarPlantilla();

await actualizarPlantilla('prompt_template:123', {
  nombre: "Nuevo nombre",
  descripcion: "Nueva descripción",
});
```

#### `useEliminarPlantilla()`
Elimina una plantilla.

```tsx
const { eliminarPlantilla, isEliminando } = useEliminarPlantilla();

await eliminarPlantilla('prompt_template:123');
```

#### `useClonarPlantilla()`
Clona una plantilla existente.

```tsx
const { clonarPlantilla, isClonando } = useClonarPlantilla();

await clonarPlantilla('prompt_template:123', 'Mi copia');
```

#### `useRenderizarPlantilla()`
Renderiza una plantilla con variables.

```tsx
const { renderizarPlantilla, isRenderizando } = useRenderizarPlantilla();

const promptRenderizado = await renderizarPlantilla('prompt_template:123', {
  tema: "Interfaces en TypeScript",
  programa_nombre: "Curso de TypeScript",
  nivel_profundidad: "4",
});
```

---

## Patrones de Integración

### 1. Editar Contenido con Versionamiento

```tsx
function EditorComponente({ componenteId }: { componenteId: string }) {
  // Cargar contenido
  const { contenido, isLoading } = useContenido(componenteId);
  const { guardarContenido, isGuardando } = useGuardarContenido(componenteId);

  // Estado local del editor
  const [contenidoLocal, setContenidoLocal] = useState<any>(null);

  // Sincronizar con API
  useEffect(() => {
    if (contenido?.contenido) {
      setContenidoLocal(contenido.contenido);
    }
  }, [contenido]);

  // Auto-guardado
  useEffect(() => {
    if (!contenidoLocal) return;

    const timer = setTimeout(async () => {
      await guardarContenido(contenidoLocal);
    }, 30000); // 30 segundos

    return () => clearTimeout(timer);
  }, [contenidoLocal]);

  const handleSave = async () => {
    await guardarContenido(contenidoLocal);
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <Editor
        value={contenidoLocal}
        onChange={setContenidoLocal}
      />
      <Button onClick={handleSave} disabled={isGuardando}>
        {isGuardando ? 'Guardando...' : 'Guardar'}
      </Button>
    </div>
  );
}
```

### 2. Gestionar Rúbricas desde Editor

```tsx
function EditorConRubrica({ componenteId }: { componenteId: string }) {
  const [showRubrica, setShowRubrica] = useState(false);

  return (
    <div>
      {/* Editor de contenido */}
      <EditorContenido componenteId={componenteId} />

      {/* Botón en toolbar */}
      <Button onClick={() => setShowRubrica(true)}>
        <FileText className="mr-2 h-4 w-4" />
        Gestionar Rúbrica
      </Button>

      {/* Modal de rúbrica */}
      <RubricaEditor
        componenteId={componenteId}
        open={showRubrica}
        onOpenChange={setShowRubrica}
      />
    </div>
  );
}
```

### 3. Usar Plantillas para Generar Contenido

```tsx
function GeneradorConPlantillas() {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const { renderizarPlantilla } = useRenderizarPlantilla();

  const handleUseTemplate = async (template: PromptTemplate) => {
    setSelectedTemplate(template);

    // Renderizar con variables
    const promptRenderizado = await renderizarPlantilla(template.id, {
      programa_nombre: "Mi Programa",
      fase_nombre: "Fase 1",
      tema: "TypeScript Avanzado",
    });

    // Llamar a API de generación con el prompt renderizado
    await generarContenido(promptRenderizado, template.config_default);
  };

  return (
    <TemplateLibraryIntegrated
      onSelectTemplate={handleUseTemplate}
      tipoComponenteFiltro="leccion"
    />
  );
}
```

### 4. Vista de Historial de Versiones

```tsx
function HistorialVersiones({ componenteId }: { componenteId: string }) {
  const { versiones, isLoading } = useHistorialVersiones(componenteId);
  const { restaurarVersion, isRestaurando } = useRestaurarVersion();

  const handleRestaurar = async (versionId: string) => {
    if (!confirm('¿Restaurar esta versión?')) return;

    await restaurarVersion(
      componenteId,
      versionId,
      'Restauración manual desde historial'
    );
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-2">
      {versiones.map(version => (
        <Card key={version.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">
                Versión {version.numero_version}
              </h4>
              <p className="text-sm text-muted-foreground">
                {version.cambios_descripcion}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(version.created_at).toLocaleString()}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleRestaurar(version.id)}
              disabled={isRestaurando}
            >
              <History className="mr-2 h-4 w-4" />
              Restaurar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

---

## Configuración de SWR

Para que los hooks funcionen correctamente, asegúrate de tener configurado SWR en tu app:

```tsx
// app/layout.tsx o app/providers.tsx
import { SWRConfig } from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error en la petición');
  }
  return res.json();
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

---

## Manejo de Errores

Todos los hooks incluyen manejo de errores integrado con toasts:

```tsx
// Los errores se muestran automáticamente
const { guardarContenido } = useGuardarContenido(componenteId);

try {
  await guardarContenido(contenido);
  // Toast de éxito se muestra automáticamente
} catch (error) {
  // Toast de error se muestra automáticamente
  // Puedes agregar lógica adicional aquí si lo necesitas
}
```

---

## Testing

### Ejemplo de test para hooks:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { useContenido } from '@/lib/hooks/use-contenido';

describe('useContenido', () => {
  it('debe cargar el contenido correctamente', async () => {
    const wrapper = ({ children }: any) => (
      <SWRConfig value={{ dedupingInterval: 0 }}>
        {children}
      </SWRConfig>
    );

    const { result } = renderHook(() => useContenido('componente:123'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contenido).toBeDefined();
    expect(result.current.contenido?.tipo).toBe('leccion');
  });
});
```

---

## Próximos Pasos

1. **Integrar otros editores** (notebook, simulation, tool) siguiendo el mismo patrón que `lesson-editor-integrated.tsx`

2. **Agregar indicadores de versión** en los editores para mostrar el número de versión actual

3. **Implementar comparación visual** entre versiones (diff)

4. **Agregar modal de confirmación** antes de publicar contenido con cambios significativos

5. **Implementar preview de plantillas** antes de usarlas para generar contenido

---

## Conclusión

Con estos componentes y hooks, el frontend de la Fase 4 está completamente funcional y listo para usarse. Todos los componentes siguen las mejores prácticas de React y están optimizados con SWR para el manejo de caché y revalidación automática.
