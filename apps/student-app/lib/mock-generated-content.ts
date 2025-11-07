import type { ContenidoGenerado, PromptTemplate } from "@/types/content"

export const mockLeccionGenerada: ContenidoGenerado = {
  id: "gen-1",
  tipo: "leccion",
  nombre: "Introducción al Customer-Solution Fit",
  config_usada: {
    programa_nombre: "Lean Startup Mastery",
    fase_nombre: "Validación de Problema",
    proof_point_nombre: "Customer-Solution Fit Validation",
    proof_point_pregunta: "¿Existe un problema real que valga la pena resolver?",
    nivel_nombre: "Fundamentos de CSF",
    nivel_objetivo: "Comprender qué es Customer-Solution Fit y por qué es crítico",
    tipo_componente: "leccion",
    nombre_componente: "Introducción al Customer-Solution Fit",
    nivel_profundidad: 3,
    estilo_narrativo: "conversacional",
    duracion_target: 20,
    elementos_incluir: ["ejemplos", "actividades", "reflexiones"],
    ejemplos_visuales: ["Diagramas", "Tablas comparativas"],
    conceptos_enfatizar: ["Customer-Solution Fit", "Problem-Solution Fit"],
    casos_incluir: ["Dropbox MVP", "Airbnb Early Days"],
    modelo_ia: "gpt4o",
    temperatura: 0.7,
    usar_few_shot: true,
  },
  contenido: {
    markdown: `# Introducción al Customer-Solution Fit

## ¿Qué es el Customer-Solution Fit?

El **Customer-Solution Fit (CSF)** es el primer hito crítico en el desarrollo de una startup exitosa. Representa el momento en que has validado que:

1. Existe un problema real y significativo
2. Tu solución propuesta resuena con los clientes potenciales
3. Los clientes están dispuestos a cambiar su comportamiento actual

### ¿Por qué es tan importante?

Muchos emprendedores cometen el error de enamorarse de su solución antes de validar el problema. Esto lleva a construir productos que nadie quiere. El CSF te obliga a poner el problema primero.

> "No te enamores de tu solución. Enamórate del problema que estás resolviendo." - Ash Maurya

## El Framework de Validación

El proceso de alcanzar Customer-Solution Fit sigue estos pasos:

### 1. Identificación del Problema

Antes de pensar en soluciones, necesitas entender profundamente el problema:

- ¿Quién experimenta este problema?
- ¿Con qué frecuencia ocurre?
- ¿Cuál es el costo actual de no resolverlo?
- ¿Qué alternativas están usando ahora?

**Actividad Práctica:** Identifica 3 problemas que has experimentado personalmente en la última semana. Para cada uno, responde las preguntas anteriores.

### 2. Segmentación de Clientes

No todos los clientes son iguales. Necesitas identificar tu segmento inicial:

| Criterio | Early Adopters | Mayoría Temprana | Mayoría Tardía |
|----------|----------------|------------------|----------------|
| Tolerancia al riesgo | Alta | Media | Baja |
| Necesidad del problema | Urgente | Importante | Nice-to-have |
| Disposición a pagar | Alta | Media | Baja |

Enfócate primero en los **Early Adopters**: tienen el problema de forma más aguda y están dispuestos a probar soluciones imperfectas.

### 3. Propuesta de Valor Inicial

Tu propuesta de valor debe ser clara y específica:

\`\`\`
Para [segmento de cliente]
Que [necesidad o problema]
Nuestro [producto/servicio]
Es una [categoría]
Que [beneficio clave]
A diferencia de [alternativa]
Nosotros [diferenciador]
\`\`\`

## Caso de Estudio: Dropbox

Drew Houston, fundador de Dropbox, validó Customer-Solution Fit de forma brillante:

**El Problema:** Las personas necesitaban acceder a sus archivos desde múltiples dispositivos, pero las soluciones existentes (USB, email, FTP) eran complicadas y poco confiables.

**La Validación:** En lugar de construir el producto completo, Houston creó un video de 3 minutos mostrando cómo funcionaría Dropbox. El video se volvió viral en Hacker News.

**El Resultado:** La lista de espera pasó de 5,000 a 75,000 personas en una noche. Esto validó que:
- El problema era real y significativo
- La solución propuesta resonaba con el mercado
- Había demanda antes de escribir una línea de código

**Pregunta de Reflexión:** ¿Qué podrías hacer para validar tu idea sin construir el producto completo?

## Errores Comunes en la Búsqueda de CSF

### Error #1: Preguntar "¿Usarías esto?"

Esta pregunta lleva a respuestas falsamente positivas. Las personas son educadas y optimistas. En cambio, pregunta:

- "¿Cómo resuelves este problema hoy?"
- "¿Cuánto te cuesta (tiempo/dinero) la solución actual?"
- "¿Qué has intentado antes?"

### Error #2: Hablar con Amigos y Familia

Tus amigos quieren apoyarte y te dirán lo que quieres escuchar. Necesitas hablar con extraños que experimentan el problema real.

### Error #3: Confundir Interés con Compromiso

"Suena interesante" no es validación. Busca señales de compromiso real:

- ¿Están dispuestos a pagar un depósito?
- ¿Te dan acceso a su sistema actual?
- ¿Invierten tiempo en sesiones de co-creación?

## Herramientas para Validar CSF

### Entrevistas de Problema

Las entrevistas de problema son tu herramienta principal. Estructura:

1. **Contexto** (5 min): Conoce al entrevistado
2. **Narrativa del problema** (15 min): Deja que cuenten su historia
3. **Exploración** (10 min): Profundiza en aspectos específicos
4. **Cierre** (5 min): Próximos pasos

**Tip:** Graba las entrevistas (con permiso). Escucharás cosas que no notaste en el momento.

### Landing Page de Validación

Crea una landing page que:
- Explique el problema claramente
- Presente tu solución propuesta
- Tenga un call-to-action claro (email, pre-order, etc.)

Usa ads de bajo costo para dirigir tráfico y medir interés real.

## Métricas de Customer-Solution Fit

¿Cómo sabes que has alcanzado CSF? Busca estas señales:

- **Tasa de conversión de interés a compromiso:** >40% de las personas que expresan interés toman una acción concreta
- **Referidos espontáneos:** Las personas te refieren a otros sin que lo pidas
- **Disposición a pagar:** Al menos 30% están dispuestos a pagar por adelantado
- **Claridad del problema:** Puedes explicar el problema en 30 segundos y la gente dice "¡Exacto!"

## Próximos Pasos

Una vez que has validado Customer-Solution Fit, el siguiente paso es construir tu MVP (Minimum Viable Product) para validar Product-Market Fit. Pero eso es tema de la siguiente fase.

**Actividad Final:** Completa el cuaderno de trabajo "Validación de CSF" donde aplicarás estos conceptos a tu propia idea de negocio.

---

**Recursos Adicionales:**
- "The Mom Test" por Rob Fitzpatrick
- "Running Lean" por Ash Maurya
- "The Lean Startup" por Eric Ries`,
    estructura: [
      { tipo: "header", contenido: "Introducción al Customer-Solution Fit", nivel: 1 },
      { tipo: "header", contenido: "¿Qué es el Customer-Solution Fit?", nivel: 2 },
      { tipo: "paragraph", contenido: "El Customer-Solution Fit (CSF) es el primer hito crítico..." },
    ],
  },
  metadata: {
    palabras: 2850,
    tiempo_lectura: 23,
    secciones: 8,
    ejemplos: 6,
    actividades: 3,
  },
  analisis_calidad: {
    score_general: 85,
    metricas: {
      lecturabilidad: {
        score: 92,
        detalles: [
          "Flesch Reading Ease: 68 (Bueno)",
          "Nivel educativo: 10-12 grado",
          "Longitud promedio de frase: 18 palabras",
        ],
        badge: "Excelente",
      },
      cobertura_conceptos: {
        score: 88,
        detalles: ["Conceptos cubiertos: 7 de 8", "Concepto faltante: Jobs-to-be-Done Framework"],
        badge: "Muy bien",
        sugerencia: "Considera agregar sección sobre Jobs-to-be-Done",
      },
      longitud: {
        score: 75,
        detalles: ["Longitud actual: 2,850 palabras", "Objetivo: 2,500 palabras (20 min)", "Diferencia: +14%"],
        badge: "Aceptable",
        sugerencia: "Contenido ligeramente largo. Considera condensar secciones secundarias.",
      },
      ejemplos_practicos: {
        score: 95,
        detalles: ["Ejemplos incluidos: 6", "Casos de estudio: 2", "Ejercicios prácticos: 3"],
        badge: "Excelente",
      },
      accesibilidad: {
        score: 90,
        detalles: [
          "Estructura de headers: Correcta",
          "Alt text en imágenes: Pendiente (placeholders)",
          "Contraste de texto: Cumple WCAG AA",
        ],
        badge: "Muy bien",
        nota: "Agrega alt text cuando insertes imágenes finales",
      },
      estructura_pedagogica: {
        score: 85,
        detalles: [
          "Apertura: Presente",
          "Desarrollo: Bien estructurado",
          "Actividades: 3 embebidas",
          "Cierre reflexivo: Presente",
        ],
        badge: "Excelente",
      },
    },
    sugerencias: [
      {
        id: "sug-1",
        prioridad: "alta",
        tipo: "contenido_faltante",
        titulo: "Agregar concepto Jobs-to-be-Done",
        descripcion: "Este concepto está en la documentación de fase pero no aparece en el contenido",
        accion_disponible: true,
      },
      {
        id: "sug-2",
        prioridad: "media",
        tipo: "longitud",
        titulo: "Reducir longitud en ~350 palabras",
        descripcion: "Para cumplir el objetivo de duración de 20 minutos",
        accion_disponible: true,
      },
      {
        id: "sug-3",
        prioridad: "baja",
        tipo: "visualizacion",
        titulo: "Agregar más visualizaciones",
        descripcion: "Hay 2 placeholders de imágenes. Considera agregar 1-2 más.",
        accion_disponible: false,
      },
    ],
    comparacion_objetivos: [
      {
        objetivo: "Cubrir concepto de Customer-Solution Fit",
        cumplido: true,
      },
      {
        objetivo: "Incluir ejemplos de casos reales",
        cumplido: true,
      },
      {
        objetivo: "Duración target: 20 minutos",
        cumplido: false,
        nota: "Actual: 23 minutos estimados",
      },
      {
        objetivo: "Nivel de profundidad: Intermedio",
        cumplido: true,
      },
    ],
  },
  fecha_generacion: "2025-01-15T10:30:00Z",
  estado: "preview",
}

export const mockTemplates: PromptTemplate[] = [
  {
    id: "tpl-1",
    nombre: "Lección Introductoria Estándar",
    tipo_componente: "leccion",
    descripcion: "Template para lecciones introductorias con estructura clara y ejemplos prácticos",
    prompt_template: `# CONTEXTO
Eres un diseñador instruccional experto creando contenido para Xpertia Platform.

## Programa: {{programa_nombre}}
## Fase: {{fase_nombre}}
## Proof Point: {{proof_point_nombre}}

# TAREA
Genera una lección introductoria que cubra los fundamentos de {{concepto_principal}}.

# ESTRUCTURA
1. Introducción enganchadora (2-3 párrafos)
2. Definición clara del concepto
3. Por qué es importante
4. Framework o modelo conceptual
5. 2-3 ejemplos prácticos
6. Errores comunes
7. Actividad práctica
8. Resumen y próximos pasos`,
    config_default: {
      tipo_componente: "leccion",
      nivel_profundidad: 3,
      estilo_narrativo: "conversacional",
      duracion_target: 20,
      elementos_incluir: ["ejemplos", "actividades", "reflexiones"],
    },
    autor: "Equipo Xpertia",
    es_oficial: true,
    usos: 156,
    rating: 4.8,
    fecha_creacion: "2024-12-01T00:00:00Z",
  },
  {
    id: "tpl-2",
    nombre: "Cuaderno de Aplicación Práctica",
    tipo_componente: "cuaderno",
    descripcion: "Template para cuadernos que guían la aplicación de conceptos al proyecto del estudiante",
    prompt_template: `# CONTEXTO
Crea un cuaderno de trabajo que guíe al estudiante a aplicar {{concepto_principal}} a su propio proyecto.

# ESTRUCTURA
- 3-4 secciones temáticas
- Cada sección con 2-3 preguntas guía
- Mezcla de preguntas de reflexión y aplicación
- Incluye ejemplos de respuestas fuertes para calibración`,
    config_default: {
      tipo_componente: "cuaderno",
      numero_secciones: 3,
      tipos_pregunta: ["reflexion", "aplicacion"],
      incluir_ejemplos_respuesta: true,
      nivel_guia: 3,
    },
    autor: "María González",
    es_oficial: false,
    usos: 89,
    rating: 4.6,
    fecha_creacion: "2025-01-05T00:00:00Z",
  },
  {
    id: "tpl-3",
    nombre: "Simulación de Entrevista",
    tipo_componente: "simulacion",
    descripcion: "Template para simulaciones de entrevistas de validación con clientes potenciales",
    prompt_template: `# CONTEXTO
Crea una simulación de entrevista donde el estudiante practica {{habilidad_principal}}.

# PERSONAJE
- Rol: {{rol_personaje}}
- Personalidad: {{personalidad}}
- Background realista del sector

# BANCO DE RESPUESTAS
Genera 80-100 respuestas variadas que:
- Reflejen la personalidad del personaje
- Cubran diferentes caminos de conversación
- Incluyan respuestas evasivas, profundas y reveladoras`,
    config_default: {
      tipo_componente: "simulacion",
      habilidades_evaluar: ["Escucha activa", "Preguntas abiertas", "Profundización"],
    },
    autor: "Equipo Xpertia",
    es_oficial: true,
    usos: 234,
    rating: 4.9,
    fecha_creacion: "2024-11-15T00:00:00Z",
  },
]
