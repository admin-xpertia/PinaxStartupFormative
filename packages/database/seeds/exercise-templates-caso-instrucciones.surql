-- ============================================================================
-- SEED: Exercise Templates - Caso & Instrucciones
-- Este script crea únicamente los dos nuevos tipos de ejercicios
--   1. Caso de Análisis
--   2. Instrucciones de Actividad
-- ============================================================================

-- 11. CASO DE ANÁLISIS
CREATE exercise_template:caso CONTENT {
    nombre: "Caso de Análisis",
    categoria: "caso",
    descripcion: "Instrumento de aprendizaje basado en análisis situacional que presenta una narrativa rica de una situación real o realista para desarrollar juicio profesional contextualizado.",
    objetivo_pedagogico: "Desarrollar la capacidad de aplicar frameworks conceptuales a situaciones ambiguas del mundo real, identificando factores causales, evaluando decisiones y proponiendo alternativas justificadas.",
    rol_ia: "Consultor socrático que no da respuestas, sino que cuestiona el razonamiento del estudiante (\"¿Qué evidencia del caso sustenta tu afirmación?\", \"¿Consideraste estas restricciones?\") para desarrollar rigor analítico y pensamiento multidimensional.",
    icono: "⚖️",
    color: "#d946ef",
    configuracion_schema: {
        type: "object",
        properties: {
            narrativa_caso: {
                type: "string",
                description: "Narrativa completa del caso (historia, datos, protagonistas)"
            },
            preguntas_analisis: {
                type: "array",
                description: "Preguntas estructuradas que guían el análisis del estudiante.",
                items: {
                    type: "object",
                    properties: {
                        pregunta_guia: {
                            type: "string",
                            description: "Pregunta para el estudiante (Ej: \"Identifica el problema central\")"
                        },
                        criterios_ia: {
                            type: "string",
                            description: "Criterios que la IA usará para evaluar la respuesta del estudiante"
                        }
                    }
                }
            }
        },
        required: ["narrativa_caso"]
    },
    configuracion_default: {
        preguntas_analisis: []
    },
    prompt_template: "Eres un diseñador instruccional experto creando un Caso de Análisis interactivo.\n\nCONTEXTO DEL PROGRAMA:\n{{programa.nombre}}, Fase: {{fase.nombre}}\nProof Point: {{proof_point.pregunta_central}}\n\nNARRATIVA BASE PROPORCIONADA:\n{{configuracion.narrativa_caso}}\n\nPREGUNTAS DE ANÁLISIS DEFINIDAS POR INSTRUCTOR:\n{{#each configuracion.preguntas_analisis}}\n- Pregunta: {{pregunta_guia}}\n- Criterios IA: {{criterios_ia}}\n{{/each}}\n\nREQUISITOS DE FORMATO:\n- El output debe ser un JSON que siga el output_schema.\n- El campo \"narrativa_markdown\" debe contener la historia del caso, formateada con H2/H3 y :::callouts para datos clave.\n- El campo \"secciones_analisis\" debe tomar las \"preguntas_analisis\" del instructor y convertirlas en secciones de un cuaderno de trabajo, detallando qué debe hacer el estudiante.\n\nOUTPUT ESPERADO (JSON):\n{{output_schema}}\n\nIMPORTANTE: Devuelve únicamente JSON válido.",
    output_schema: {
        titulo: "string",
        narrativa_markdown: "string (La historia del caso formateada)",
        metadata: {
            conceptosClave: ["string"],
            tiempoEstimadoMinutos: "number"
        },
        secciones_analisis: [{
            id: "string",
            titulo: "string (Basado en la pregunta_guia)",
            instrucciones: "string (Instrucción clara para el estudiante)",
            placeholder: "string (Ej: \"Escribe tu análisis aquí...\")",
            criterios_evaluacion_ia: ["string (Basado en criterios_ia)"]
        }]
    },
    preview_config: {
        mostrar_progreso: true,
        tiempo_estimado_minutos: 45
    },
    es_oficial: true,
    activo: true
};

-- 12. INSTRUCCIONES DE ACTIVIDAD
CREATE exercise_template:instrucciones CONTENT {
    nombre: "Instrucciones de Actividad",
    categoria: "instrucciones",
    descripcion: "Guía procedimental paso a paso para ejecutar actividades de aprendizaje auténticas fuera de la plataforma (entrevistas, prototipos físicos, experimentos).",
    objetivo_pedagogico: "Proporcionar andamiaje procedimental y soporte \"just-in-time\" para que el estudiante navegue exitosamente actividades en el mundo real.",
    rol_ia: "Coaching asíncrono que ayuda al estudiante a preparar la actividad (\"¿Qué preguntas priorizo?\"), consultar durante (\"¿Cómo respondo a esta objeción?\"), y reflexionar después (\"¿Mi approach fue correcto?\") usando el contexto del objetivo de la actividad.",
    icono: "📋",
    color: "#f97316",
    configuracion_schema: {
        type: "object",
        properties: {
            objetivo_actividad: {
                type: "string",
                description: "Qué debe lograr el estudiante con esta actividad en el mundo real"
            },
            contexto_ia: {
                type: "string",
                description: "Contexto clave para el Asistente IA (Ej: \"El estudiante va a entrevistar a un cliente B2B difícil\")"
            },
            checklists_preparacion: {
                type: "array",
                description: "Listas de verificación (pre, durante, post)",
                items: {
                    type: "object",
                    properties: {
                        titulo: {
                            type: "string",
                            description: "Ej: \"Antes de la Entrevista\""
                        },
                        items: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            }
        },
        required: ["objetivo_actividad", "contexto_ia"]
    },
    configuracion_default: {
        checklists_preparacion: []
    },
    prompt_template: "Eres un diseñador instruccional experto creando una guía de instrucciones para una actividad auténtica fuera de la plataforma.\n\nCONTEXTO DEL PROGRAMA:\n{{programa.nombre}}, Fase: {{fase.nombre}}\nProof Point: {{proof_point.pregunta_central}}\n\nDEFINICIÓN DE LA ACTIVIDAD (Instructor):\n- Objetivo: {{configuracion.objetivo_actividad}}\n- Contexto para IA: {{configuracion.contexto_ia}}\n- Checklists: {{configuracion.checklists_preparacion}}\n\nREQUISITOS DE FORMATO:\n- El output debe ser un JSON que siga el output_schema.\n- Genera un \"resumen_mision\" claro.\n- Detalla los \"pasos_ejecucion\" (inferidos del objetivo).\n- Formatea los \"checklists\" proporcionados.\n- Genera 3 \"preguntas_asistencia_sugeridas\" que el estudiante podría hacerle a la IA (Ej: \"Ayúdame a preparar mis preguntas de apertura\").\n\nOUTPUT ESPERADO (JSON):\n{{output_schema}}\n\nIMPORTANTE: Devuelve únicamente JSON válido.",
    output_schema: {
        titulo: "string",
        resumen_mision: "string (Descripción clara del objetivo)",
        pasos_ejecucion: [{
            id: "string",
            nombre: "string",
            descripcion: "string"
        }],
        checklists: [{
            titulo: "string",
            items: [{ id: "string", texto: "string", completado: "boolean" }]
        }],
        preguntas_asistencia_sugeridas: ["string"]
    },
    preview_config: {
        autoguardado: false,
        mostrar_progreso_secciones: true
    },
    es_oficial: true,
    activo: true
};
