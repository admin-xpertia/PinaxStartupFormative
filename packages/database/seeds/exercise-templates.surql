-- ============================================================================
-- SEED: EXERCISE TEMPLATES
-- ============================================================================
-- Inserta los 10 tipos de ejercicios mediados por IA en la base de datos
-- Fecha: 2025-11-06
-- ============================================================================

-- Nota: Este script asume que la tabla exercise_template ya ha sido creada

-- 1. LECCIÓN INTERACTIVA
CREATE exercise_template:leccion_interactiva CONTENT {
    nombre: "Lección Interactiva",
    categoria: "leccion_interactiva",
    descripcion: "Transmitir conocimiento conceptual de manera activa donde el aprendiz interactúa con el contenido en lugar de consumirlo pasivamente, permitiendo verificar comprensión en tiempo real.",
    objetivo_pedagogico: "Facilitar aprendizaje activo mediante contenido interactivo con verificación de comprensión inmediata",
    rol_ia: "La IA actúa como facilitador de aprendizaje activo que evalúa respuestas inmediatamente, proporciona feedback explicativo, genera casos de aplicación múltiples, contextualiza términos técnicos mediante glosario dinámico, y adapta profundidad de explicaciones según nivel de comprensión.",
    icono: "📖",
    color: "#3b82f6",
    configuracion_schema: {
        duracion_minutos: { type: "number", label: "Duración estimada (minutos)", default: 20, min: 10, max: 60 },
        profundidad: { type: "select", label: "Nivel de profundidad", options: ["basica", "intermedia", "avanzada"], default: "intermedia" },
        incluir_quizzes: { type: "boolean", label: "Incluir quizzes embebidos", default: true },
        incluir_glosario: { type: "boolean", label: "Incluir glosario de términos", default: true },
        numero_ejemplos: { type: "number", label: "Número de ejemplos prácticos", default: 3, min: 1, max: 5 }
    },
    configuracion_default: {
        duracion_minutos: 20,
        profundidad: "intermedia",
        incluir_quizzes: true,
        incluir_glosario: true,
        numero_ejemplos: 3
    },
    prompt_template: "Eres un diseñador instruccional experto creando una lección interactiva.\n\nCONTEXTO DEL PROGRAMA:\nPrograma: {{programa.nombre}}\nFase: {{fase.nombre}} - {{fase.descripcion}}\n\nCONTEXTO DEL PROOF POINT:\nPregunta Central: {{proof_point.pregunta_central}}\nDocumentación: {{proof_point.documentacion_contexto}}\n\nDOCUMENTACIÓN DE LA FASE:\n{{fase_documentation}}\n\nCONSIDERACIONES DEL INSTRUCTOR:\n{{consideraciones}}\n\nCONFIGURACIÓN:\nDuración: {{configuracion.duracion_minutos}} minutos\nProfundidad: {{configuracion.profundidad}}\nIncluir quizzes: {{configuracion.incluir_quizzes}}\nIncluir glosario: {{configuracion.incluir_glosario}}\nNúmero de ejemplos: {{configuracion.numero_ejemplos}}\n\nTAREA:\nGenera una lección interactiva que transmita conocimiento conceptual de manera activa. La lección debe:\n1. Tener una introducción enganchadora que conecte con la pregunta central del proof point\n2. Dividirse en 3-5 secciones lógicas, cada una con contenido markdown rico\n3. Incluir {{configuracion.numero_ejemplos}} ejemplos prácticos que ilustren los conceptos\n4. Si incluir_quizzes=true: Agregar 1 quiz por sección para verificar comprensión\n5. Si incluir_glosario=true: Crear glosario de términos técnicos clave\n6. Terminar con un resumen conciso y recursos adicionales\n\nOUTPUT ESPERADO (JSON):\n{{output_schema}}",
    output_schema: {
        titulo: "string",
        introduccion: "string (markdown)",
        secciones: [{
            titulo: "string",
            contenido: "string (markdown)",
            ejemplos: ["string"],
            quiz: {
                pregunta: "string",
                opciones: ["string"],
                respuesta_correcta: "number",
                explicacion: "string"
            }
        }],
        glosario: [{ termino: "string", definicion: "string" }],
        resumen: "string (markdown)",
        recursos_adicionales: ["string"]
    },
    preview_config: {
        demo_data: {
            titulo: "Validación de Hipótesis en Emprendimiento",
            introduccion: "# ¿Cómo sabemos si nuestra idea realmente resolverá un problema?\n\nAntes de invertir recursos...",
            secciones: [
                {
                    titulo: "Diferencia entre Validación y Verificación",
                    contenido: "La **validación** responde: *¿Estamos construyendo lo correcto?*...",
                    ejemplos: ["Airbnb validó la demanda rentando su propio apartamento"],
                    quiz: {
                        pregunta: "¿Cuál de estos es un ejemplo de validación?",
                        opciones: ["Testear que el botón funciona", "Confirmar que usuarios pagarían por la solución"],
                        respuesta_correcta: 1,
                        explicacion: "Validar es confirmar que estamos resolviendo el problema correcto"
                    }
                }
            ]
        }
    },
    es_oficial: true,
    activo: true
};

-- 2. CUADERNO DE TRABAJO
CREATE exercise_template:cuaderno_trabajo CONTENT {
    nombre: "Cuaderno de Trabajo",
    categoria: "cuaderno_trabajo",
    descripcion: "Guiar al aprendiz a documentar, estructurar y reflexionar sobre su propio trabajo, proporcionando andamiaje que gradualmente se retira mientras se evalúa calidad y se ofrece feedback formativo continuo.",
    objetivo_pedagogico: "Desarrollar capacidad de reflexión estructurada y documentación rigurosa del pensamiento",
    rol_ia: "La IA funciona como editor inteligente y evaluador de proceso que analiza patrones de pensamiento, proporciona feedback en tiempo real, valida completitud y coherencia, identifica gaps específicos, y evalúa rigor del razonamiento.",
    icono: "📝",
    color: "#8b5cf6",
    configuracion_schema: {
        duracion_minutos: { type: "number", label: "Duración estimada (minutos)", default: 45, min: 20, max: 120 },
        numero_secciones: { type: "number", label: "Número de secciones", default: 4, min: 2, max: 8 },
        tipo_preguntas: { type: "multiselect", label: "Tipos de preguntas", options: ["reflexion", "aplicacion", "analisis", "sintesis"], default: ["reflexion", "aplicacion"] },
        nivel_andamiaje: { type: "select", label: "Nivel de andamiaje", options: ["alto", "medio", "bajo"], default: "medio" },
        feedback_tiempo_real: { type: "boolean", label: "Activar feedback en tiempo real", default: true }
    },
    configuracion_default: {
        duracion_minutos: 45,
        numero_secciones: 4,
        tipo_preguntas: ["reflexion", "aplicacion"],
        nivel_andamiaje: "medio",
        feedback_tiempo_real: true
    },
    prompt_template: "Eres un diseñador instruccional experto creando un cuaderno de trabajo reflexivo.\n\nCONTEXTO: {{contexto_completo}}\n\nTAREA:\nGenera un cuaderno de trabajo con {{configuracion.numero_secciones}} secciones que guíe al estudiante a documentar y reflexionar sobre su trabajo relacionado con: {{proof_point.pregunta_central}}\n\nEl cuaderno debe:\n1. Proporcionar instrucciones claras y contextualizadas\n2. Incluir preguntas guía del tipo: {{configuracion.tipo_preguntas}}\n3. Mostrar ejemplos de respuestas fuertes\n4. Definir criterios de evaluación claros\n5. Nivel de andamiaje: {{configuracion.nivel_andamiaje}}\n\nOUTPUT (JSON): {{output_schema}}",
    output_schema: {
        titulo: "string",
        instrucciones_generales: "string (markdown)",
        secciones: [{
            titulo: "string",
            tipo: "string",
            instrucciones: "string (markdown)",
            preguntas_guia: ["string"],
            ejemplos_respuestas_fuertes: ["string"],
            criterios_evaluacion: ["string"],
            es_critica: "boolean"
        }],
        criterios_calidad: {
            evidencia: { peso: "number", descriptores: ["string"] },
            claridad: { peso: "number", descriptores: ["string"] },
            profundidad: { peso: "number", descriptores: ["string"] }
        }
    },
    preview_config: {},
    es_oficial: true,
    activo: true
};

-- 3. SIMULACIÓN DE INTERACCIÓN
CREATE exercise_template:simulacion_interaccion CONTENT {
    nombre: "Simulación de Interacción",
    categoria: "simulacion_interaccion",
    descripcion: "Permitir práctica de habilidades interpersonales o situacionales en entorno seguro donde el aprendiz interactúa con agentes IA que simulan roles específicos con comportamiento realista.",
    objetivo_pedagogico: "Desarrollar habilidades de comunicación e interacción mediante práctica en entorno seguro",
    rol_ia: "La IA encarna personajes coherentes que mantienen personalidad consistente, ajustan respuestas según calidad de preguntas, simulan señales paraverbales, escalan complejidad, y generan análisis multidimensional post-interacción.",
    icono: "💬",
    color: "#10b981",
    configuracion_schema: {
        duracion_minutos: { type: "number", default: 30, min: 15, max: 60 },
        tipo_personaje: { type: "select", options: ["cliente", "usuario", "inversor", "colaborador", "mentor", "custom"], default: "cliente" },
        nivel_dificultad: { type: "select", options: ["cooperativo", "neutral", "desafiante"], default: "neutral" },
        numero_turnos_minimo: { type: "number", default: 10, min: 5, max: 30 },
        evaluar_tecnicas: { type: "multiselect", options: ["escucha_activa", "preguntas_abiertas", "empatia", "validacion", "sintesis"], default: ["escucha_activa", "preguntas_abiertas"] }
    },
    configuracion_default: {
        duracion_minutos: 30,
        tipo_personaje: "cliente",
        nivel_dificultad: "neutral",
        numero_turnos_minimo: 10,
        evaluar_tecnicas: ["escucha_activa", "preguntas_abiertas"]
    },
    prompt_template: "Eres un diseñador de simulaciones creando una interacción conversacional realista.\n\nCONTEXTO: {{contexto_completo}}\n\nTAREA:\nCrea una simulación donde el estudiante interactúa con un {{configuracion.tipo_personaje}} para practicar habilidades de comunicación.\n\nDificultad: {{configuracion.nivel_dificultad}}\nMínimo de turnos: {{configuracion.numero_turnos_minimo}}\nTécnicas a evaluar: {{configuracion.evaluar_tecnicas}}\n\nOUTPUT (JSON): {{output_schema}}",
    output_schema: {
        titulo: "string",
        contexto_simulacion: "string",
        personaje: {
            nombre: "string",
            rol: "string",
            background: "string",
            personalidad: "string",
            objetivos_conversacion: ["string"],
            estilo_comunicacion: "string"
        },
        escenario_inicial: "string",
        mensaje_apertura: "string",
        banco_respuestas: [{ contexto: "string", variantes: ["string"], senales_paraverbales: "string" }],
        criterios_evaluacion: {}
    },
    preview_config: {},
    es_oficial: true,
    activo: true
};

-- 4. MENTOR Y ASESOR IA
CREATE exercise_template:mentor_asesor_ia CONTENT {
    nombre: "Mentor y Asesor IA",
    categoria: "mentor_asesor_ia",
    descripcion: "Proporcionar guidance especializado desde perspectiva de experto en un rol o dominio específico, simulando relación mentor-mentee con cuestionamiento socrático y enseñanza contextualizada.",
    objetivo_pedagogico: "Desarrollar pensamiento crítico mediante cuestionamiento socrático y guidance experto",
    rol_ia: "La IA asume identidad de experto que hace preguntas socráticas, identifica trade-offs no considerados, evalúa decisiones con criterios del campo, explica el 'por qué' detrás de mejores prácticas, y contextualiza metodologías.",
    icono: "🧑‍🏫",
    color: "#f59e0b",
    configuracion_schema: {
        duracion_minutos: { type: "number", default: 30, min: 15, max: 60 },
        tipo_mentor: { type: "select", options: ["emprendedor_serial", "inversor", "product_manager", "cientifico", "diseñador", "custom"], default: "emprendedor_serial" },
        estilo_mentoria: { type: "select", options: ["socratico", "directivo", "exploratorio"], default: "socratico" },
        numero_mentores: { type: "number", default: 1, min: 1, max: 4 }
    },
    configuracion_default: {
        duracion_minutos: 30,
        tipo_mentor: "emprendedor_serial",
        estilo_mentoria: "socratico",
        numero_mentores: 1
    },
    prompt_template: "Eres un diseñador de experiencias de mentoría creando una sesión de guidance experto.\n\nCONTEXTO: {{contexto_completo}}\n\nTAREA:\nCrea una experiencia de mentoría con {{configuracion.numero_mentores}} mentor(es) del tipo {{configuracion.tipo_mentor}} con estilo {{configuracion.estilo_mentoria}}.\n\nOUTPUT (JSON): {{output_schema}}",
    output_schema: {
        titulo: "string",
        contexto_mentoria: "string",
        mentores: [{ nombre: "string", rol: "string", expertise: "string" }],
        situacion_inicial: "string",
        objetivos_sesion: ["string"]
    },
    preview_config: {},
    es_oficial: true,
    activo: true
};

-- 5. HERRAMIENTA DE ANÁLISIS Y EVALUACIÓN
CREATE exercise_template:herramienta_analisis CONTENT {
    nombre: "Herramienta de Análisis y Evaluación",
    categoria: "herramienta_analisis",
    descripcion: "Procesar trabajo del aprendiz y generar análisis estructurado con diagnóstico, evaluación contra criterios múltiples, y recomendaciones accionables específicas.",
    objetivo_pedagogico: "Proporcionar evaluación rigurosa y feedback accionable sobre trabajo del estudiante",
    rol_ia: "La IA funciona como analista riguroso que identifica patrones, evalúa contra múltiples dimensiones con evidencia específica, detecta gaps, valida coherencia, mapea claims a evidencia, y sintetiza evaluación holística.",
    icono: "🔍",
    color: "#ef4444",
    configuracion_schema: {
        duracion_minutos: { type: "number", default: 15, min: 5, max: 30 },
        dimensiones_analisis: { type: "multiselect", options: ["evidencia", "coherencia", "rigor", "completitud", "viabilidad"], default: ["evidencia", "coherencia", "completitud"] },
        tipo_trabajo: { type: "select", options: ["propuesta", "reporte", "plan", "hipotesis", "prototipo"], default: "propuesta" },
        nivel_detalle: { type: "select", options: ["basico", "detallado", "exhaustivo"], default: "detallado" }
    },
    configuracion_default: {
        duracion_minutos: 15,
        dimensiones_analisis: ["evidencia", "coherencia", "completitud"],
        tipo_trabajo: "propuesta",
        nivel_detalle: "detallado"
    },
    prompt_template: "Eres un diseñador de herramientas de evaluación creando un analizador riguroso.\n\nCONTEXTO: {{contexto_completo}}\n\nTAREA:\nCrea una herramienta que analice {{configuracion.tipo_trabajo}} del estudiante evaluando: {{configuracion.dimensiones_analisis}}\n\nNivel de detalle: {{configuracion.nivel_detalle}}\n\nOUTPUT (JSON): {{output_schema}}",
    output_schema: {
        titulo: "string",
        instrucciones: "string",
        dimensiones_evaluacion: [{ nombre: "string", peso: "number" }]
    },
    preview_config: {},
    es_oficial: true,
    activo: true
};

-- 6. HERRAMIENTA DE CREACIÓN Y GENERACIÓN
CREATE exercise_template:herramienta_creacion CONTENT {
    nombre: "Herramienta de Creación y Generación",
    categoria: "herramienta_creacion",
    descripcion: "Asistir al aprendiz en crear outputs (documentos, visuales, prototipos) proporcionando andamiaje generativo que acelera producción sin reemplazar su pensamiento crítico.",
    objetivo_pedagogico: "Acelerar ciclos de creación manteniendo el pensamiento crítico del estudiante",
    rol_ia: "La IA actúa como asistente creativo que traduce información en visualizaciones, genera borradores útiles pero imperfectos, crea múltiples variaciones, y mantiene la voz del aprendiz.",
    icono: "✨",
    color: "#ec4899",
    configuracion_schema: {
        duracion_minutos: { type: "number", default: 30, min: 15, max: 60 },
        tipo_output: { type: "select", options: ["documento", "diagrama", "canvas", "prototipo", "presentacion"], default: "canvas" },
        numero_variaciones: { type: "number", default: 3, min: 1, max: 5 },
        nivel_refinamiento: { type: "select", options: ["borrador", "intermedio", "pulido"], default: "borrador" }
    },
    configuracion_default: {
        duracion_minutos: 30,
        tipo_output: "canvas",
        numero_variaciones: 3,
        nivel_refinamiento: "borrador"
    },
    prompt_template: "Eres un diseñador de herramientas generativas creando un asistente creativo.\n\nCONTEXTO: {{contexto_completo}}\n\nTAREA:\nCrea una herramienta que ayude al estudiante a crear {{configuracion.tipo_output}} con {{configuracion.numero_variaciones}} variaciones al nivel {{configuracion.nivel_refinamiento}}.\n\nOUTPUT (JSON): {{output_schema}}",
    output_schema: {
        titulo: "string",
        tipo_output: "string",
        inputs_requeridos: [{ nombre: "string", tipo: "string" }]
    },
    preview_config: {},
    es_oficial: true,
    activo: true
};

-- 7. SISTEMA DE TRACKING Y MONITOREO
CREATE exercise_template:sistema_tracking CONTENT {
    nombre: "Sistema de Tracking y Monitoreo",
    categoria: "sistema_tracking",
    descripcion: "Mantener visibilidad continua del progreso, identificar tendencias longitudinales, y alertar proactivamente cuando atención o intervención es necesaria.",
    objetivo_pedagogico: "Mantener accountability y visibilidad del progreso del estudiante",
    rol_ia: "La IA opera como sistema de vigilancia inteligente que visualiza estado vs objetivos, solicita updates regulares, detecta patrones problemáticos, y dispara intervenciones proactivas.",
    icono: "📊",
    color: "#06b6d4",
    configuracion_schema: {
        duracion_minutos: { type: "number", default: 10, min: 5, max: 20 },
        frecuencia_updates: { type: "select", options: ["diario", "semanal", "cada_hito"], default: "semanal" },
        metricas_track: { type: "multiselect", options: ["tiempo_invertido", "hitos_completados", "calidad_trabajo", "adherencia_proceso"], default: ["hitos_completados", "calidad_trabajo"] }
    },
    configuracion_default: {
        duracion_minutos: 10,
        frecuencia_updates: "semanal",
        metricas_track: ["hitos_completados", "calidad_trabajo"]
    },
    prompt_template: "Eres un diseñador de sistemas de tracking creando un monitor de progreso.\n\nCONTEXTO: {{contexto_completo}}\n\nTAREA:\nCrea un sistema que trackee {{configuracion.metricas_track}} con frecuencia {{configuracion.frecuencia_updates}}.\n\nOUTPUT (JSON): {{output_schema}}",
    output_schema: {
        titulo: "string",
        metricas_configuradas: [{ nombre: "string", tipo: "string" }]
    },
    preview_config: {},
    es_oficial: true,
    activo: true
};

-- 8. HERRAMIENTA DE REVISIÓN Y FEEDBACK
CREATE exercise_template:herramienta_revision CONTENT {
    nombre: "Herramienta de Revisión y Feedback",
    categoria: "herramienta_revision",
    descripcion: "Proporcionar retroalimentación formativa en tiempo real o post-tarea que sea específica, accionable, balanceada y adaptada al nivel de dominio del aprendiz.",
    objetivo_pedagogico: "Proporcionar feedback formativo continuo que acelere aprendizaje",
    rol_ia: "La IA funciona como revisor experto que proporciona feedback no-intrusivo priorizando señalamientos, genera análisis post-tarea balanceado, adapta según estado liminal, y conecta feedback con recursos.",
    icono: "✏️",
    color: "#84cc16",
    configuracion_schema: {
        duracion_minutos: { type: "number", default: 15, min: 5, max: 30 },
        momento_feedback: { type: "select", options: ["tiempo_real", "post_tarea", "ambos"], default: "ambos" },
        estilo_feedback: { type: "select", options: ["constructivo", "socratico", "directivo"], default: "constructivo" },
        nivel_estudiante: { type: "select", options: ["pre_liminal", "liminal", "post_liminal"], default: "liminal" }
    },
    configuracion_default: {
        duracion_minutos: 15,
        momento_feedback: "ambos",
        estilo_feedback: "constructivo",
        nivel_estudiante: "liminal"
    },
    prompt_template: "Eres un diseñador de sistemas de feedback creando un revisor experto.\n\nCONTEXTO: {{contexto_completo}}\n\nTAREA:\nCrea una herramienta de feedback {{configuracion.momento_feedback}} con estilo {{configuracion.estilo_feedback}} para estudiantes nivel {{configuracion.nivel_estudiante}}.\n\nOUTPUT (JSON): {{output_schema}}",
    output_schema: {
        titulo: "string",
        criterios_revision: [{ nombre: "string", peso: "number" }]
    },
    preview_config: {},
    es_oficial: true,
    activo: true
};

-- 9. SIMULADOR DE ENTORNO
CREATE exercise_template:simulador_entorno CONTENT {
    nombre: "Simulador de Entorno",
    categoria: "simulador_entorno",
    descripcion: "Crear entornos virtuales donde el aprendiz puede experimentar, construir o practicar sin consecuencias del mundo real, acelerando ciclos de aprendizaje.",
    objetivo_pedagogico: "Permitir experimentación segura y rápida sin consecuencias del mundo real",
    rol_ia: "La IA construye y gestiona mundos simulados que responden realísticamente, genera datos sintéticos coherentes, permite experimentación controlada, y explica relaciones causales.",
    icono: "🌍",
    color: "#14b8a6",
    configuracion_schema: {
        duracion_minutos: { type: "number", default: 40, min: 20, max: 90 },
        tipo_entorno: { type: "select", options: ["mercado", "organizacion", "sistema_tecnico", "ecosistema"], default: "mercado" },
        nivel_complejidad: { type: "select", options: ["simple", "moderado", "complejo"], default: "moderado" },
        variables_controlables: { type: "multiselect", options: ["precio", "marketing", "producto", "operaciones"], default: ["precio", "producto"] }
    },
    configuracion_default: {
        duracion_minutos: 40,
        tipo_entorno: "mercado",
        nivel_complejidad: "moderado",
        variables_controlables: ["precio", "producto"]
    },
    prompt_template: "Eres un diseñador de simulaciones creando un entorno experimental.\n\nCONTEXTO: {{contexto_completo}}\n\nTAREA:\nCrea un simulador de {{configuracion.tipo_entorno}} con complejidad {{configuracion.nivel_complejidad}} donde el estudiante controla: {{configuracion.variables_controlables}}.\n\nOUTPUT (JSON): {{output_schema}}",
    output_schema: {
        titulo: "string",
        tipo_entorno: "string",
        estado_inicial: { variables: {} }
    },
    preview_config: {},
    es_oficial: true,
    activo: true
};

-- 10. SISTEMA DE PROGRESIÓN Y DESBLOQUEO
CREATE exercise_template:sistema_progresion CONTENT {
    nombre: "Sistema de Progresión y Desbloqueo",
    categoria: "sistema_progresion",
    descripcion: "Gestionar flujo del aprendiz a través del programa asegurando dominio suficiente antes de avanzar, personalizando ruta según fortalezas/debilidades, y manteniendo motivación mediante desbloqueos apropiados.",
    objetivo_pedagogico: "Asegurar dominio antes de progresión mientras se mantiene motivación",
    rol_ia: "La IA opera como guardián pedagógico que evalúa objetivamente, diagnostica dominio, recomienda rutas adaptativas, verifica pre-requisitos, permite reintentos con diagnóstico, y balancea personalización con estructura.",
    icono: "🔓",
    color: "#a855f7",
    configuracion_schema: {
        duracion_minutos: { type: "number", default: 20, min: 10, max: 45 },
        tipo_evaluacion: { type: "select", options: ["quiz", "proyecto", "portafolio", "mixto"], default: "mixto" },
        umbral_progresion: { type: "number", default: 70, min: 60, max: 90 },
        permitir_reintentos: { type: "boolean", default: true },
        numero_reintentos_max: { type: "number", default: 3, min: 1, max: 5 }
    },
    configuracion_default: {
        duracion_minutos: 20,
        tipo_evaluacion: "mixto",
        umbral_progresion: 70,
        permitir_reintentos: true,
        numero_reintentos_max: 3
    },
    prompt_template: "Eres un diseñador de sistemas de evaluación creando un guardián pedagógico.\n\nCONTEXTO: {{contexto_completo}}\n\nTAREA:\nCrea una evaluación tipo {{configuracion.tipo_evaluacion}} con umbral {{configuracion.umbral_progresion}}% que permita {{configuracion.numero_reintentos_max}} reintentos.\n\nOUTPUT (JSON): {{output_schema}}",
    output_schema: {
        titulo: "string",
        tipo_evaluacion: "string",
        umbral_progresion: {}
    },
    preview_config: {},
    es_oficial: true,
    activo: true
};
