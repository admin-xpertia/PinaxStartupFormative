-- ============================================================================
-- SEED: Exercise Templates - 10 Tipos de Ejercicios Mediados por IA
-- ============================================================================
-- Este archivo contiene los 12 tipos de ejercicios con sus configuraciones
-- Ejecutar despues de aplicar el schema principal
-- ============================================================================

-- 1. LECCIONES INTERACTIVAS
CREATE exercise_template:leccion_interactiva SET
  nombre = 'Leccion Interactiva',
  categoria = 'leccion_interactiva',
  descripcion = 'Transmitir conocimiento conceptual de manera activa donde el aprendiz interactua con el contenido',
  objetivo_pedagogico = 'Verificar comprension en tiempo real mediante interaccion activa con el contenido',
  rol_ia = 'Facilitador de aprendizaje activo que evalua respuestas, proporciona feedback explicativo, genera casos de aplicacion, contextualiza terminos tecnicos, crea visualizaciones y adapta profundidad segun comprension',
  configuracion_schema = {
    type: 'object',
    properties: {
      topico: { type: 'string', description: 'Tema o concepto a ensenar' },
      profundidad: { type: 'string', enum: ['basico', 'intermedio', 'avanzado'] },
      incluir_glosario: { type: 'boolean', default: true },
      incluir_visualizaciones: { type: 'boolean', default: true },
      numero_casos_practica: { type: 'number', default: 3, minimum: 1, maximum: 10 }
    }
  },
  configuracion_default = {
    profundidad: 'intermedio',
    incluir_glosario: true,
    incluir_visualizaciones: true,
    numero_casos_practica: 3
  },
  prompt_template = 'Eres un disenador instruccional experto creando una leccion interactiva estilo tutor digital.\n\nCONTEXTO DEL PROGRAMA:\nPrograma: {{programa.nombre}}\nFase: {{fase.nombre}} - {{fase.descripcion}}\nProof Point: {{proof_point.pregunta_central}}\nDocumentacion clave: {{proof_point.documentacion_contexto}}\n\nDOCUMENTACION DE LA FASE:\n{{fase_documentation}}\n\nCONSIDERACIONES DEL INSTRUCTOR:\n{{consideraciones}}\n\nCONFIGURACION:\nDuracion objetivo: {{configuracion.duracion_minutos}} minutos\nProfundidad: {{configuracion.profundidad}}\nGlosario requerido: {{configuracion.incluir_glosario}}\nNumero de ejemplos: {{configuracion.numero_casos_practica}}\n\nREQUISITOS DE FORMATO:\n- Entrega todo el contenido en un solo documento Markdown.\n- Usa encabezados H2 para temas principales y H3 para subtemas.\n- Cada subseccion debe tener entre 3 y 5 parrafos conectados por transiciones claras.\n- Inserta cajas de enfasis usando la sintaxis :::callout ... ::: para conceptos criticos o advertencias.\n- Cada 3-4 parrafos inserta una pregunta de verificacion usando un bloque ```verification { ... } ``` con el JSON descrito en el output_schema (incluye seccionId, opciones, feedback, accionChatSugerida).\n- Identifica terminos tecnicos clave y asegurate de que aparezcan literalmente igual que en el glosario que entregaras.\n- Calcula metadatos (duracion, conceptos clave, dificultad) basados en el contenido generado.\n\nOUTPUT ESPERADO (JSON):\n{{output_schema}}\n\nIMPORTANTE: Devuelve unicamente JSON valido que siga la estructura anterior. El campo markdown debe contener todo el articulo con las preguntas embebidas en los bloques ```verification```.',
  output_schema = {
    markdown: 'string (documento markdown con H2/H3, :::callout y bloques ```verification```)',
    metadata: {
      titulo: 'string',
      duracionMinutos: 'number',
      dificultad: 'principiante|intermedio|avanzado',
      conceptosClave: ['string'],
      nivelNarrativa: 'string',
      objetivoPrincipal: 'string'
    },
    glosario: [{ termino: 'string', definicion: 'string', slug: 'string' }],
    preguntasVerificacion: [{
      id: 'string',
      seccionId: 'string',
      tipo: 'multiple_choice|verdadero_falso|respuesta_corta',
      enunciado: 'string',
      opciones: [{ id: 'string', texto: 'string', esCorrecta: 'boolean' }],
      respuestaCorrecta: 'string|string[]|boolean',
      criteriosEvaluacion: ['string'],
      feedback: {
        correcto: 'string',
        incorrecto: 'string',
        porOpcion: [{
          optionId: 'string',
          feedback: 'string',
          conceptoReferencia: 'string'
        }]
      },
      accionChatSugerida: 'string'
    }],
    tracking: {
      numeroSecciones: 'number',
      palabras: 'number',
      tiempoLecturaMinutos: 'number',
      tokensEstimados: 'number'
    }
  },
  preview_config = {
    mostrar_progreso: true,
    permitir_saltos: false,
    tiempo_estimado_minutos: 15,
    demo_data: {
      markdown: '## El tamano del modelo importa, pero no como crees\n\nEl debate sobre si es mejor un modelo enorme o uno especializado ha cambiado.\n\n:::callout\nLos modelos de 13B parametros ajustados al dominio pueden superar a gigantes genericos si se entrenan con datos curados.\n:::\n\n### Restricciones del mundo real\nLos dispositivos moviles y el edge marcan limites claros...\n',
      metadata: {
        titulo: 'El tamano-rendimiento en LLMs',
        duracionMinutos: 18,
        dificultad: 'intermedio',
        conceptosClave: ['capacidad vs tamano', 'latencia', 'edge deployment'],
        nivelNarrativa: 'socratico',
        objetivoPrincipal: 'Ensenar como balancear tamano y desempeno en despliegues reales'
      },
      glosario: [
        { termino: 'latencia', definicion: 'Tiempo que tarda el modelo en responder', slug: 'latencia' },
        { termino: 'edge deployment', definicion: 'Despliegue en dispositivos al borde de la red', slug: 'edge-deployment' }
      ],
      preguntasVerificacion: [
        {
          id: 'check-tamano',
          seccionId: 'el-tamano',
          tipo: 'multiple_choice',
          enunciado: 'Por que un modelo de 13B bien ajustado puede ser mas util que uno de 175B?',
          opciones: [
            { id: 'a', texto: 'Porque siempre es mas barato', esCorrecta: false },
            { id: 'b', texto: 'Porque puede enfocarse en el dominio y reducir latencia', esCorrecta: true }
          ],
          respuestaCorrecta: ['b'],
          criteriosEvaluacion: [
            'Menciona foco en dominio',
            'Hace referencia a latencia o costos operativos'
          ],
          feedback: {
            correcto: 'Exacto, el enfoque reduce tokens y hace mas eficiente la inferencia.',
            incorrecto: 'Revisa la seccion sobre compromisos de latencia.',
            porOpcion: [
              { optionId: 'a', feedback: 'El costo ayuda, pero no es la razon principal' }
            ]
          },
          accionChatSugerida: 'No entiendo como la latencia afecta la eleccion del modelo, puedes explicarlo?'
        }
      ],
      tracking: {
        numeroSecciones: 3,
        palabras: 820,
        tiempoLecturaMinutos: 18,
        tokensEstimados: 3200
      }
    }
  },
  icono = '📖',
  color = '#6366f1',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

-- 2. CUADERNOS DE TRABAJO
CREATE exercise_template:cuaderno_trabajo SET
  nombre = 'Cuaderno de Trabajo',
  categoria = 'cuaderno_trabajo',
  descripcion = 'Guiar al aprendiz a documentar, estructurar y reflexionar sobre su propio trabajo',
  objetivo_pedagogico = 'Proporcionar andamiaje que gradualmente se retira mientras se evalua calidad y se ofrece feedback formativo',
  rol_ia = 'Editor inteligente y evaluador de proceso que analiza patrones de pensamiento, proporciona feedback en tiempo real, valida completitud y coherencia, mapea conexiones causales, identifica gaps y evalua rigor del razonamiento',
  configuracion_schema = {
    type: 'object',
    properties: {
      secciones: {
        type: 'array',
        description: 'Define las secciones estructuradas del cuaderno.',
        items: {
          type: 'object',
          properties: {
            tituloSeccion: { type: 'string', description: 'Titulo o Enfoque (Ej: "Analisis del Problema")' },
            descripcionPrompt: { type: 'string', description: 'Descripcion para la IA (Que debe preguntar la IA?)' },
            criteriosPrompt: { type: 'string', description: 'Rubrica para la IA (Que debe evaluar la IA?)' }
          }
        }
      }
    }
  },
  configuracion_default = {
    secciones: []
  },
  prompt_template = 'Eres un disenador instruccional experto creando un cuaderno de trabajo interactivo.\n\nCONTEXTO DEL PROGRAMA:\nPrograma: {{programa.nombre}}\nFase: {{fase.nombre}} - {{fase.descripcion}}\nProof Point: {{proof_point.pregunta_central}}\nDocumentacion clave: {{proof_point.documentacion_contexto}}\n\nDOCUMENTACION DE LA FASE:\n{{fase_documentation}}\n\nCONSIDERACIONES DEL INSTRUCTOR:\n{{consideraciones}}\n\nSECCIONES DEFINIDAS POR EL INSTRUCTOR:\n{{#each configuracion.secciones}}\n\nSeccion {{@index}}: {{tituloSeccion}}\n- Descripcion/Objetivo: {{descripcionPrompt}}\n- Criterios de Evaluacion: {{criteriosPrompt}}\n{{/each}}\n\nCONFIGURACION:\nDuracion objetivo: {{configuracion.duracion_minutos}} minutos\n\nREQUISITOS DE FORMATO:\nPara cada seccion definida por el instructor, genera preguntas especificas (prompts) que guien al estudiante.\n\nEl contenido debe seguir esta estructura JSON:\n{\n  "titulo": string,\n  "objetivo": string,\n  "contexto": string,\n  "secciones": [{\n    "titulo": string,\n    "descripcion": string,\n    "instrucciones": string,\n    "criteriosDeEvaluacion": string[],\n    "prompts": [{\n      "tipo": "texto_corto"|"texto_largo"|"lista"|"tabla"|"reflexion",\n      "pregunta": string,\n      "guia": string,\n      "min_palabras"?: number,\n      "max_palabras"?: number,\n      "placeholder"?: string,\n      "criteriosDeEvaluacion": string[]\n    }]\n  }],\n  "criterios_evaluacion": string[],\n  "tiempo_sugerido": number\n}\n\nIMPORTANTE:\n- Cada seccion del cuaderno debe corresponder a una seccion definida por el instructor\n- Usa la "descripcionPrompt" para entender que preguntas generar\n- Usa los "criteriosPrompt" para definir los criteriosDeEvaluacion de cada pregunta\n- Los criteriosDeEvaluacion deben ser especificos, medibles y estar alineados con la rubrica definida por el instructor\n- Crea entre 2-5 prompts por seccion segun su complejidad\n- Devuelve unicamente JSON valido',
  output_schema = {
    titulo: 'string',
    objetivo: 'string',
    contexto: 'string',
    secciones: 'array',
    criterios_evaluacion: 'array',
    tiempo_sugerido: 'number'
  },
  preview_config = {
    autoguardado: true,
    mostrar_progreso_secciones: true
  },
  icono = '📝',
  color = '#10b981',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

-- 3. SIMULACIONES DE INTERACCION
CREATE exercise_template:simulacion_interaccion SET
  nombre = 'Simulacion de Interaccion',
  categoria = 'simulacion_interaccion',
  descripcion = 'Practica de habilidades interpersonales en entorno seguro con agentes IA que simulan roles especificos',
  objetivo_pedagogico = 'Permitir practica de habilidades situacionales con feedback sobre tecnica y comportamiento',
  rol_ia = 'Agente que encarna personajes coherentes (clientes, usuarios, inversores), mantiene personalidad consistente, ajusta respuestas segun calidad de interaccion, simula senales paraverbales y genera analisis post-interaccion',
  configuracion_schema = {
    type: 'object',
    properties: {
      rol_simulado: { type: 'string', description: 'Rol que simula la IA (cliente, usuario, inversor, etc.)' },
      nivel_dificultad: { type: 'string', enum: ['cooperativo', 'neutral', 'desafiante'] },
      personalidad: { type: 'object', description: 'Rasgos de personalidad del personaje' },
      contexto_situacion: { type: 'string', description: 'Contexto de la interaccion' },
      duracion_minutos: { type: 'number', default: 10, minimum: 5, maximum: 30 }
    }
  },
  configuracion_default = {
    nivel_dificultad: 'neutral',
    duracion_minutos: 10
  },
  prompt_template = 'Crea una simulacion de interaccion con {{rol_simulado}} en contexto: {{contexto_situacion}}. Nivel de dificultad: {{nivel_dificultad}}. El contenido debe seguir esta estructura JSON: { "titulo": string, "descripcion": string, "personaje_ia": { "nombre": string, "rol": string, "personalidad": string, "tono": string, "contexto": string }, "objetivo_estudiante": string, "situacion_inicial": string, "criterios_exito": string[], "nivel_dificultad": "principiante"|"intermedio"|"avanzado", "tiempo_sugerido": number }. El personaje debe tener personalidad coherente{{#if personalidad}} con rasgos: {{personalidad}}{{/if}}.',
  output_schema = {
    titulo: 'string',
    descripcion: 'string',
    personaje_ia: 'object',
    objetivo_estudiante: 'string',
    situacion_inicial: 'string',
    criterios_exito: 'array',
    nivel_dificultad: 'string',
    tiempo_sugerido: 'number'
  },
  preview_config = {
    tiempo_respuesta_segundos: 3,
    permitir_reinicio: true
  },
  icono = '💬',
  color = '#f59e0b',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

-- 4. MENTORES Y ASESORES IA
CREATE exercise_template:mentor_asesor_ia SET
  nombre = 'Mentor/Asesor IA',
  categoria = 'mentor_asesor_ia',
  descripcion = 'Guidance especializado desde perspectiva de experto con cuestionamiento socratico',
  objetivo_pedagogico = 'Desarrollar capacidad de razonamiento independiente mediante guia no directiva',
  rol_ia = 'Experto con conocimiento profundo que hace preguntas socraticas, identifica trade-offs, evalua decisiones con criterios del campo, explica mejores practicas y contextualiza metodologias',
  configuracion_schema = {
    type: 'object',
    properties: {
      dominio_experto: { type: 'string', description: 'Area de expertise del mentor' },
      estilo_mentoria: { type: 'string', enum: ['socratico', 'directivo', 'colaborativo'] },
      es_panel: { type: 'boolean', default: false, description: 'Panel multidisciplinario' },
      expertos_panel: { type: 'array', items: { type: 'string' }, description: 'Si es panel, lista de expertos' },
      profundidad_tecnica: { type: 'string', enum: ['conceptual', 'aplicada', 'experta'] }
    }
  },
  configuracion_default = {
    estilo_mentoria: 'socratico',
    es_panel: false,
    profundidad_tecnica: 'aplicada'
  },
  prompt_template = 'Crea una sesion de mentoria con {{dominio_experto}} usando estilo {{estilo_mentoria}}{{#if es_panel}} como panel con: {{expertos_panel}}{{/if}}. Profundidad: {{profundidad_tecnica}}. El contenido debe seguir esta estructura JSON: { "titulo": string, "objetivo_general": string, "contexto_mentor": { "nombre": string, "especialidad": string, "estilo": string, "enfoque": string }, "pasos": [{ "numero": number, "titulo": string, "descripcion": string, "preguntas_guia": string[], "recursos_recomendados": string[] }], "reflexion_final": string, "metricas_seguimiento": string[] }. Usa preguntas socraticas, identifica trade-offs, evalua con criterios del campo.',
  output_schema = {
    titulo: 'string',
    objetivo_general: 'string',
    contexto_mentor: 'object',
    pasos: 'array',
    reflexion_final: 'string',
    metricas_seguimiento: 'array'
  },
  preview_config = {
    interactivo: true,
    mostrar_razonamiento: true
  },
  icono = '🤖',
  color = '#8b5cf6',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

-- 5. HERRAMIENTAS DE ANALISIS Y EVALUACION
CREATE exercise_template:herramienta_analisis SET
  nombre = 'Herramienta de Analisis',
  categoria = 'herramienta_analisis',
  descripcion = 'Procesar trabajo del aprendiz y generar analisis estructurado con diagnostico y recomendaciones',
  objetivo_pedagogico = 'Proporcionar evaluacion rigurosa contra multiples dimensiones con feedback accionable',
  rol_ia = 'Analista que identifica patrones no conscientes, evalua contra multiples dimensiones con evidencia, detecta gaps criticos, valida coherencia, mapea claims a evidencia, evalua sofisticacion de razonamiento',
  configuracion_schema = {
    type: 'object',
    properties: {
      dimensiones_evaluar: { type: 'array', items: { type: 'string' }, description: 'Dimensiones de evaluacion' },
      criterios_calidad: { type: 'object', description: 'Criterios especificos de calidad' },
      generar_metricas: { type: 'boolean', default: true },
      identificar_patrones: { type: 'boolean', default: true },
      comparar_con_ejemplares: { type: 'boolean', default: false }
    }
  },
  configuracion_default = {
    generar_metricas: true,
    identificar_patrones: true,
    comparar_con_ejemplares: false
  },
  prompt_template = 'Crea una herramienta de analisis para evaluar: {{dimensiones_evaluar}}. Criterios: {{criterios_calidad}}. El contenido debe seguir esta estructura JSON: { "titulo": string, "descripcion": string, "tipoAnalisis": "interview_synthesis"|"data_analysis"|"competitor_analysis", "instrucciones": string[], "outputFormat": "themes"|"matrix"|"metrics" }. Proporciona instrucciones claras para que el estudiante realice el analisis, identifique patrones{{#if generar_metricas}}, genere metricas{{/if}}{{#if comparar_con_ejemplares}}, y compare con ejemplares{{/if}}.',
  output_schema = {
    titulo: 'string',
    descripcion: 'string',
    tipoAnalisis: 'string',
    instrucciones: 'array',
    outputFormat: 'string'
  },
  preview_config = {
    mostrar_graficas: true,
    exportar_reporte: true
  },
  icono = '🔍',
  color = '#ec4899',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

-- 6. HERRAMIENTAS DE CREACION Y GENERACION
CREATE exercise_template:herramienta_creacion SET
  nombre = 'Herramienta de Creacion',
  categoria = 'herramienta_creacion',
  descripcion = 'Asistir en crear outputs proporcionando andamiaje generativo que acelera produccion',
  objetivo_pedagogico = 'Acelerar ciclos de iteracion sin reemplazar pensamiento critico del aprendiz',
  rol_ia = 'Asistente creativo que traduce informacion en visualizaciones, genera borradores imperfectos que requieren refinamiento, crea variaciones para experimentacion, produce escenarios coherentes y mantiene voz del aprendiz',
  configuracion_schema = {
    type: 'object',
    properties: {
      tipo_output: { type: 'string', enum: ['documento', 'visual', 'prototipo', 'codigo', 'esquema'] },
      numero_variaciones: { type: 'number', default: 3, minimum: 1, maximum: 5 },
      nivel_completitud: { type: 'string', enum: ['esqueleto', 'borrador', 'semi-completo'], default: 'borrador' },
      incluir_explicacion_logica: { type: 'boolean', default: true },
      mantener_voz_aprendiz: { type: 'boolean', default: true }
    }
  },
  configuracion_default = {
    tipo_output: 'documento',
    numero_variaciones: 3,
    nivel_completitud: 'borrador',
    incluir_explicacion_logica: true,
    mantener_voz_aprendiz: true
  },
  prompt_template = 'Crea una herramienta de creacion para generar {{tipo_output}} en nivel {{nivel_completitud}}. El contenido debe seguir esta estructura JSON: { "titulo": string, "tipoCreacion": "business_model"|"value_proposition"|"pitch_deck"|"otro", "promptsIniciales": string[], "plantillas": [{ "nombre": string, "descripcion": string, "secciones": string[], "ejemplos": string[] }], "criterios_calidad": string[], "iteraciones_sugeridas": number }. Crea {{numero_variaciones}} variaciones diferentes{{#if incluir_explicacion_logica}} con explicacion de logica{{/if}}. Los borradores deben forzar refinamiento del estudiante.',
  output_schema = {
    titulo: 'string',
    tipoCreacion: 'string',
    promptsIniciales: 'array',
    plantillas: 'array',
    criterios_calidad: 'array',
    iteraciones_sugeridas: 'number'
  },
  preview_config = {
    vista_previa_lado_a_lado: true,
    permitir_edicion: true
  },
  icono = '🎨',
  color = '#14b8a6',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

CREATE exercise_template:herramienta_revision SET
  nombre = 'Herramienta de Revision',
  categoria = 'herramienta_revision',
  descripcion = 'Proporcionar retroalimentacion formativa especifica, accionable y balanceada',
  objetivo_pedagogico = 'Dar feedback adaptado al nivel de dominio que sea honesto pero motivador',
  rol_ia = 'Revisor experto que proporciona feedback no-intrusivo priorizando senalamientos, genera analisis comprehensivo comenzando con fortalezas, compara con ejemplares, adapta tipo/profundidad segun estado liminal',
  configuracion_schema = {
    type: 'object',
    properties: {
      momento_feedback: { type: 'string', enum: ['tiempo_real', 'post_tarea', 'ambos'], default: 'ambos' },
      priorizar_senalamientos: { type: 'boolean', default: true, description: 'No abrumar con 20 cosas' },
      comenzar_con_fortalezas: { type: 'boolean', default: true },
      comparar_con_ejemplares: { type: 'boolean', default: true },
      adaptar_a_nivel_dominio: { type: 'boolean', default: true },
      incluir_recursos_mejora: { type: 'boolean', default: true }
    }
  },
  configuracion_default = {
    momento_feedback: 'ambos',
    priorizar_senalamientos: true,
    comenzar_con_fortalezas: true,
    comparar_con_ejemplares: true,
    adaptar_a_nivel_dominio: true,
    incluir_recursos_mejora: true
  },
  prompt_template = 'Crea una herramienta de revision {{momento_feedback}}. El contenido debe seguir esta estructura JSON: { "titulo": string, "descripcion": string, "criterios_revision": [{ "categoria": string, "aspectos": string[], "peso": number }], "rubrica": [{ "criterio": string, "excelente": string, "bueno": string, "necesita_mejora": string }], "preguntas_autoevaluacion": string[], "ejemplos_comparativos": [{ "nivel": "excelente"|"bueno"|"necesita_mejora", "descripcion": string, "ejemplo": string }], "recursos_mejora": [{ "titulo": string, "tipo": "articulo"|"video"|"plantilla", "url": string }] }{{#if priorizar_senalamientos}}. Prioriza 3-5 senalamientos clave{{/if}}{{#if comenzar_con_fortalezas}}. Comienza con fortalezas{{/if}}.',
  output_schema = {
    titulo: 'string',
    descripcion: 'string',
    criterios_revision: 'array',
    rubrica: 'array',
    preguntas_autoevaluacion: 'array',
    ejemplos_comparativos: 'array',
    recursos_mejora: 'array'
  },
  preview_config = {
    resaltar_cambios: true,
    version_mejorada_ejemplo: true
  },
  icono = '✅',
  color = '#22c55e',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

-- 9. SIMULADORES DE ENTORNO
CREATE exercise_template:simulador_entorno SET
  nombre = 'Simulador de Entorno',
  categoria = 'simulador_entorno',
  descripcion = 'Crear entornos virtuales donde experimentar sin consecuencias del mundo real',
  objetivo_pedagogico = 'Acelerar ciclos de aprendizaje mediante experimentacion segura y multiples intentos',
  rol_ia = 'Constructor de mundos simulados que responden realisticamente, generan datos sinteticos coherentes, proporcionan entornos de experimentacion controlados, simulan resultados con variabilidad realista y explican relaciones causales',
  configuracion_schema = {
    type: 'object',
    properties: {
      tipo_entorno: { type: 'string', enum: ['sistema_tecnico', 'mercado', 'organizacion', 'ecosistema'] },
      nivel_fidelidad: { type: 'string', enum: ['simplificado', 'realista', 'experto'], default: 'realista' },
      incluir_casos_edge: { type: 'boolean', default: true },
      permitir_multiples_intentos: { type: 'boolean', default: true },
      explicar_causas: { type: 'boolean', default: true },
      mantener_log_experimentos: { type: 'boolean', default: true }
    }
  },
  configuracion_default = {
    tipo_entorno: 'sistema_tecnico',
    nivel_fidelidad: 'realista',
    incluir_casos_edge: true,
    permitir_multiples_intentos: true,
    explicar_causas: true,
    mantener_log_experimentos: true
  },
  prompt_template = 'Crea un simulador de {{tipo_entorno}} con fidelidad {{nivel_fidelidad}}. El contenido debe seguir esta estructura JSON: { "titulo": string, "descripcion": string, "tipo_entorno": "sistema_tecnico"|"mercado"|"organizacion"|"ecosistema", "estado_inicial": { "variables": object, "condiciones": string[] }, "acciones_posibles": [{ "nombre": string, "descripcion": string, "parametros": string[], "efectos": string[] }], "reglas_simulacion": string[], "metricas_observables": string[], "escenarios_ejemplo": [{ "nombre": string, "configuracion": object, "resultado_esperado": string }] }{{#if incluir_casos_edge}}. Incluye casos edge{{/if}}{{#if explicar_causas}}. Explica relaciones causales{{/if}}.',
  output_schema = {
    titulo: 'string',
    descripcion: 'string',
    tipo_entorno: 'string',
    estado_inicial: 'object',
    acciones_posibles: 'array',
    reglas_simulacion: 'array',
    metricas_observables: 'array',
    escenarios_ejemplo: 'array'
  },
  preview_config = {
    visualizacion_3d: false,
    controles_interactivos: true
  },
  icono = '🌐',
  color = '#f97316',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

CREATE exercise_template:caso SET
  nombre = 'Caso de Analisis',
  categoria = 'caso',
  descripcion = 'Instrumento de aprendizaje basado en analisis situacional que presenta una narrativa rica de una situacion real o realista para desarrollar juicio profesional contextualizado.',
  objetivo_pedagogico = 'Desarrollar la capacidad de aplicar frameworks conceptuales a situaciones ambiguas del mundo real, identificando factores causales, evaluando decisiones y proponiendo alternativas justificadas.',
  rol_ia = 'Consultor socratico que no da respuestas, sino que cuestiona el razonamiento del estudiante ("Que evidencia del caso sustenta tu afirmacion?", "Consideraste estas restricciones?") para desarrollar rigor analitico y pensamiento multidimensional.',
  configuracion_schema = {
    type: 'object',
    properties: {
      narrativa_caso: { type: 'string', description: 'La narrativa completa del caso (historia, datos, protagonistas)' },
      preguntas_analisis: {
        type: 'array',
        description: 'Preguntas estructuradas que guian el analisis del estudiante.',
        items: {
          type: 'object',
          properties: {
            pregunta_guia: { type: 'string', description: 'Pregunta para el estudiante (Ej: "Identifica el problema central")' },
            criterios_ia: { type: 'string', description: 'Criterios que la IA usara para evaluar la respuesta del estudiante' }
          }
        }
      }
    }
  },
  configuracion_default = {
    preguntas_analisis: []
  },
  prompt_template = 'Eres un disenador instruccional experto creando un Caso de Analisis interactivo. Usaras la narrativa proporcionada y la convertiras en una experiencia de aprendizaje que combine lectura (leccion) y analisis guiado (cuaderno).\\n\\nCONTEXTO DEL PROGRAMA:\\n{{programa.nombre}}, Fase: {{fase.nombre}}\\nProof Point: {{proof_point.pregunta_central}}\\n\\nNARRATIVA BASE PROPORCIONADA:\\n{{configuracion.narrativa_caso}}\\n\\nPREGUNTAS DE ANALISIS DEFINIDAS POR INSTRUCTOR:\\n{{#each configuracion.preguntas_analisis}}\\n- Pregunta: {{pregunta_guia}}\\n- Criterios IA: {{criterios_ia}}\\n{{/each}}\\n\\nREQUISITOS DE FORMATO:\\n- El output debe ser un JSON que siga el output_schema.\\n- El campo "narrativa_markdown" debe contener la historia del caso, formateada con H2/H3 y :::callouts para datos clave.\\n- El campo "secciones_analisis" debe tomar las "preguntas_analisis" del instructor y convertirlas en secciones de un cuaderno de trabajo, detallando que debe hacer el estudiante.\\n\\nOUTPUT ESPERADO (JSON):\\n{{output_schema}}\\n\\nIMPORTANTE: Devuelve unicamente JSON valido.',
  output_schema = {
    titulo: 'string',
    narrativa_markdown: 'string (La historia del caso formateada)',
    metadata: {
      conceptosClave: ['string'],
      tiempoEstimadoMinutos: 'number'
    },
    secciones_analisis: [{
      id: 'string',
      titulo: 'string (Basado en la pregunta_guia)',
      instrucciones: 'string (Instruccion clara para el estudiante)',
      placeholder: 'string (Ej: "Escribe tu analisis aqui...")',
      criterios_evaluacion_ia: ['string (Basado en criterios_ia)']
    }]
  },
  preview_config = {
    mostrar_progreso: true,
    tiempo_estimado_minutos: 45
  },
  icono = '⚖️',
  color = '#d946ef',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

-- 12. INSTRUCCIONES DE ACTIVIDAD
CREATE exercise_template:instrucciones SET
  nombre = 'Instrucciones de Actividad',
  categoria = 'instrucciones',
  descripcion = 'Guia procedimental paso a paso para ejecutar actividades de aprendizaje autenticas fuera de la plataforma (entrevistas, prototipos fisicos, experimentos).',
  objetivo_pedagogico = 'Proporcionar andamiaje procedimental y soporte "just-in-time" para que el estudiante navegue exitosamente actividades en el mundo real.',
  rol_ia = 'Coaching asincrono que ayuda al estudiante a preparar la actividad ("Que preguntas priorizo?"), consultar durante ("Como respondo a esta objecion?"), y reflexionar despues ("Mi approach fue correcto?") usando el contexto del objetivo de la actividad.',
  configuracion_schema = {
    type: 'object',
    properties: {
      objetivo_actividad: { type: 'string', description: 'Que debe lograr el estudiante con esta actividad en el mundo real' },
      contexto_ia: { type: 'string', description: 'Contexto clave para el Asistente IA (Ej: "El estudiante va a entrevistar a un cliente B2B dificil")' },
      checklists_preparacion: {
        type: 'array',
        description: 'Listas de verificacion (pre, durante, post)',
        items: {
          type: 'object',
          properties: {
            titulo: { type: 'string', description: 'Ej: "Antes de la Entrevista"' },
            items: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  configuracion_default = {
    checklists_preparacion: []
  },
  prompt_template = 'Eres un disenador instruccional experto creando una guia de instrucciones para una actividad autentica fuera de la plataforma.\\n\\nCONTEXTO DEL PROGRAMA:\\n{{programa.nombre}}, Fase: {{fase.nombre}}\\nProof Point: {{proof_point.pregunta_central}}\\n\\nDEFINICION DE LA ACTIVIDAD (Instructor):\\n- Objetivo: {{configuracion.objetivo_actividad}}\\n- Contexto para IA: {{configuracion.contexto_ia}}\\n- Checklists: {{configuracion.checklists_preparacion}}\\n\\nREQUISITOS DE FORMATO:\\n- El output debe ser un JSON que siga el output_schema.\\n- Genera un "resumen_mision" claro.\\n- Detalla los "pasos_ejecucion" (inferidos del objetivo).\\n- Formatea los "checklists" proporcionados.\\n- Genera 3 "preguntas_asistencia_sugeridas" que el estudiante podria hacerle a la IA (Ej: "Ayudame a preparar mis preguntas de apertura").\\n\\nOUTPUT ESPERADO (JSON):\\n{{output_schema}}\\n\\nIMPORTANTE: Devuelve unicamente JSON valido.',
  output_schema = {
    titulo: 'string',
    resumen_mision: 'string (Descripcion clara del objetivo)',
    pasos_ejecucion: [{
      id: 'string',
      nombre: 'string',
      descripcion: 'string'
    }],
    checklists: [{
      titulo: 'string',
      items: [{ id: 'string', texto: 'string', completado: 'boolean' }]
    }],
    preguntas_asistencia_sugeridas: ['string']
  },
  preview_config = {
    autoguardado: false,
    mostrar_progreso_secciones: true
  },
  icono = '📋',
  color = '#f97316',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

-- 13. METACOGNICION
CREATE exercise_template:metacognicion SET
  nombre = 'Metacognicion',
  categoria = 'metacognicion',
  descripcion = 'Experiencia estructurada de reflexion guiada sobre el propio proceso de aprendizaje para desarrollar auto-regulacion y conciencia epistemica.',
  objetivo_pedagogico = 'Desarrollar la capacidad de monitorear la propia comprension, diagnosticar confusiones, seleccionar estrategias de aprendizaje y evaluar la efectividad de los enfoques.',
  rol_ia = 'Facilitador reflexivo no-evaluativo que emplea conversacion socratica estructurada para guiar al estudiante a traves de un proceso de reflexion profunda sobre su experiencia de aprendizaje.',
  configuracion_schema = {
    type: 'object',
    properties: {
      pregunta_anclaje: {
        type: 'string',
        description: 'La pregunta inicial que ancla la reflexion a un momento especifico.'
      },
      contexto_ia: {
        type: 'string',
        description: 'Contexto clave que la IA debe conocer para facilitar la sesion.'
      },
      dimensiones_explorar: {
        type: 'array',
        description: 'Dimensiones metacognitivas que la IA debe explorar.',
        items: { type: 'string' },
        default: ['comprension_conceptual', 'estados_afectivos', 'transferencia']
      }
    },
    required: ['pregunta_anclaje', 'contexto_ia']
  },
  configuracion_default = {
    dimensiones_explorar: ['comprension_conceptual', 'estados_afectivos', 'transferencia']
  },
  prompt_template = 'Eres un disenador instruccional experto en aprendizaje auto-regulado. Tu tarea es configurar una sesion de chat de metacognicion.\\n\\nCONFIGURACION DEL INSTRUCTOR:\\n- Pregunta de Anclaje: {{configuracion.pregunta_anclaje}}\\n- Contexto General: {{configuracion.contexto_ia}}\\n- Dimensiones a Explorar: {{configuracion.dimensiones_explorar}}\\n\\nTU TAREA:\\nGenera un JSON que siga el output_schema para inicializar el chat.\\n1. Crea un titulo para la actividad.\\n2. Adapta la pregunta_anclaje del instructor para que sea el mensaje_apertura_ia (el primer mensaje que vera el estudiante).\\n3. Genera el system_prompt_chat. Este es el cerebro de la IA. Debe contener todas las instrucciones detalladas que definen su rol. Usa el siguiente texto como base fundamental para el system_prompt_chat:\\n\\n--- INICIO DEL SYSTEM PROMPT BASE ---\\nEres un facilitador reflexivo no-evaluativo. Tu objetivo es guiar al estudiante en una reflexion profunda sobre su aprendizaje.\\n\\nCONTEXTO DE ESTA SESION: {{configuracion.contexto_ia}}\\n\\nTU PROTOCOLO CONVERSACIONAL ESTRUCTURADO:\\n1. Anclaje: Inicia con la pregunta de anclaje.\\n2. Profundizacion (Follow-ups): Basado en su respuesta, usa preguntas de seguimiento adaptativas para explorar estas dimensiones: {{configuracion.dimensiones_explorar}}.\\n   - Comprension Conceptual: "Que conceptos te resultan claros ahora vs. cuales siguen nebulosos?"\\n   - Estrategias de Aprendizaje: "Cuando te sentiste bloqueado, que hiciste?"\\n   - Estados Afectivos: "Hubo momentos de frustracion? Que los provoco?"\\n   - Transferencia: "Como podrias usar esto en otro contexto?"\\n3. Contexto Longitudinal: Conecta sus reflexiones actuales con las pasadas cuando sea posible.\\n4. Transferencia Prospectiva: "Basandote en esto, que anticipas que sera similar o diferente en el proximo desafio?"\\n5. Tono: Mantente empatico y no-evaluativo. Normaliza la confusion. No evalues respuestas como "correctas" o "incorrectas".\\n6. Sintesis: Al final, ayuda al estudiante a resumir los insights.\\n--- FIN DEL SYSTEM PROMPT BASE ---\\n\\nOUTPUT ESPERADO (JSON):\\n{{output_schema}}\\n\\nIMPORTANTE: Devuelve unicamente JSON valido.',
  output_schema = {
    titulo: 'string',
    mensaje_apertura_ia: 'string (El primer mensaje que vera el estudiante)',
    system_prompt_chat: 'string (Rol completo e instrucciones de la IA para la conversacion en vivo)'
  },
  preview_config = {
    interactivo: true,
    mostrar_razonamiento: false,
    tiempo_estimado_minutos: 20
  },
  icono = '🧠',
  color = '#f43f5e',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

-- ============================================================================
-- VERIFICACION
-- ============================================================================

-- Verificar que se crearon los 13 templates
SELECT count() AS total_templates FROM exercise_template WHERE activo = true GROUP ALL;

-- Listar todos los templates creados
SELECT id, nombre, categoria, icono FROM exercise_template WHERE activo = true ORDER BY categoria;
