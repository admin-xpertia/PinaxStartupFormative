-- ============================================================================
-- SEED: Exercise Templates - 10 Tipos de Ejercicios Mediados por IA
-- ============================================================================
-- Este archivo contiene los 10 tipos de ejercicios con sus configuraciones
-- Ejecutar después de aplicar el schema principal
-- ============================================================================

USE NS xpertia;
USE DB plataforma;

-- 1. LECCIONES INTERACTIVAS
UPDATE exercise_template:leccion_interactiva SET
  nombre = 'Lección Interactiva',
  categoria = 'leccion_interactiva',
  descripcion = 'Transmitir conocimiento conceptual de manera activa donde el aprendiz interactúa con el contenido',
  objetivo_pedagogico = 'Verificar comprensión en tiempo real mediante interacción activa con el contenido',
  rol_ia = 'Facilitador de aprendizaje activo que evalúa respuestas, proporciona feedback explicativo, genera casos de aplicación, contextualiza términos técnicos, crea visualizaciones y adapta profundidad según comprensión',
  configuracion_schema = {
    type: 'object',
    properties: {
      topico: { type: 'string', description: 'Tema o concepto a enseñar' },
      profundidad: { type: 'string', enum: ['básico', 'intermedio', 'avanzado'] },
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
  prompt_template = 'Crea una lección interactiva sobre {{topico}} con nivel {{profundidad}}. Incluye: 1) Explicación conceptual clara, 2) {{numero_casos_practica}} casos de aplicación, 3) Preguntas de comprensión con feedback explicativo, 4) Glosario de términos técnicos{{#if incluir_visualizaciones}}, 5) Visualizaciones o diagramas conceptuales{{/if}}',
  output_schema = {
    explicacion_conceptual: 'string',
    casos_aplicacion: 'array',
    preguntas_comprension: 'array',
    glosario: 'object',
    visualizaciones: 'array?'
  },
  preview_config = {
    mostrar_progreso: true,
    permitir_saltos: false,
    tiempo_estimado_minutos: 15
  },
  icono = '📖',
  color = '#6366f1',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

-- 2. CUADERNOS DE TRABAJO
UPDATE exercise_template:cuaderno_trabajo SET
  nombre = 'Cuaderno de Trabajo',
  categoria = 'cuaderno_trabajo',
  descripcion = 'Guiar al aprendiz a documentar, estructurar y reflexionar sobre su propio trabajo',
  objetivo_pedagogico = 'Proporcionar andamiaje que gradualmente se retira mientras se evalúa calidad y se ofrece feedback formativo',
  rol_ia = 'Editor inteligente y evaluador de proceso que analiza patrones de pensamiento, proporciona feedback en tiempo real, valida completitud y coherencia, mapea conexiones causales, identifica gaps y evalúa rigor del razonamiento',
  configuracion_schema = {
    type: 'object',
    properties: {
      tipo_trabajo: { type: 'string', enum: ['documentación', 'reflexión', 'análisis', 'síntesis', 'investigación'] },
      secciones_requeridas: { type: 'array', items: { type: 'string' } },
      nivel_andamiaje: { type: 'string', enum: ['alto', 'medio', 'bajo'] },
      feedback_tiempo_real: { type: 'boolean', default: true },
      validar_coherencia: { type: 'boolean', default: true }
    }
  },
  configuracion_default = {
    tipo_trabajo: 'documentación',
    nivel_andamiaje: 'medio',
    feedback_tiempo_real: true,
    validar_coherencia: true
  },
  prompt_template = 'Crea un cuaderno de trabajo tipo {{tipo_trabajo}} con nivel de andamiaje {{nivel_andamiaje}}. Incluye: 1) Estructura de secciones clara, 2) Prompts guía para cada sección, 3) Criterios de evaluación, 4) Sistema de validación de coherencia{{#if feedback_tiempo_real}}, 5) Feedback en tiempo real durante escritura{{/if}}',
  output_schema = {
    estructura_secciones: 'array',
    prompts_guia: 'object',
    criterios_evaluacion: 'object',
    validaciones: 'array'
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

-- 3. SIMULACIONES DE INTERACCIÓN
UPDATE exercise_template:simulacion_interaccion SET
  nombre = 'Simulación de Interacción',
  categoria = 'simulacion_interaccion',
  descripcion = 'Práctica de habilidades interpersonales en entorno seguro con agentes IA que simulan roles específicos',
  objetivo_pedagogico = 'Permitir práctica de habilidades situacionales con feedback sobre técnica y comportamiento',
  rol_ia = 'Agente que encarna personajes coherentes (clientes, usuarios, inversores), mantiene personalidad consistente, ajusta respuestas según calidad de interacción, simula señales paraverbales y genera análisis post-interacción',
  configuracion_schema = {
    type: 'object',
    properties: {
      rol_simulado: { type: 'string', description: 'Rol que simula la IA (cliente, usuario, inversor, etc.)' },
      nivel_dificultad: { type: 'string', enum: ['cooperativo', 'neutral', 'desafiante'] },
      personalidad: { type: 'object', description: 'Rasgos de personalidad del personaje' },
      contexto_situacion: { type: 'string', description: 'Contexto de la interacción' },
      duracion_minutos: { type: 'number', default: 10, minimum: 5, maximum: 30 }
    }
  },
  configuracion_default = {
    nivel_dificultad: 'neutral',
    duracion_minutos: 10
  },
  prompt_template = 'Simula una interacción con {{rol_simulado}} en contexto: {{contexto_situacion}}. Nivel de dificultad: {{nivel_dificultad}}. Mantén coherencia de personalidad{{#if personalidad}} con rasgos: {{personalidad}}{{/if}}. Incluye señales paraverbales y genera análisis de técnica al finalizar.',
  output_schema = {
    conversacion: 'array',
    señales_paraverbales: 'array',
    analisis_tecnica: 'object'
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
UPDATE exercise_template:mentor_asesor_ia SET
  nombre = 'Mentor/Asesor IA',
  categoria = 'mentor_asesor_ia',
  descripcion = 'Guidance especializado desde perspectiva de experto con cuestionamiento socrático',
  objetivo_pedagogico = 'Desarrollar capacidad de razonamiento independiente mediante guía no directiva',
  rol_ia = 'Experto con conocimiento profundo que hace preguntas socráticas, identifica trade-offs, evalúa decisiones con criterios del campo, explica mejores prácticas y contextualiza metodologías',
  configuracion_schema = {
    type: 'object',
    properties: {
      dominio_experto: { type: 'string', description: 'Área de expertise del mentor' },
      estilo_mentoria: { type: 'string', enum: ['socrático', 'directivo', 'colaborativo'] },
      es_panel: { type: 'boolean', default: false, description: 'Panel multidisciplinario' },
      expertos_panel: { type: 'array', items: { type: 'string' }, description: 'Si es panel, lista de expertos' },
      profundidad_tecnica: { type: 'string', enum: ['conceptual', 'aplicada', 'experta'] }
    }
  },
  configuracion_default = {
    estilo_mentoria: 'socrático',
    es_panel: false,
    profundidad_tecnica: 'aplicada'
  },
  prompt_template = 'Actúa como {{dominio_experto}} usando estilo {{estilo_mentoria}}{{#if es_panel}} como parte de panel con: {{expertos_panel}}{{/if}}. Profundidad: {{profundidad_tecnica}}. Usa preguntas socráticas para exponer debilidades en razonamiento, identifica trade-offs no considerados, evalúa decisiones con criterios del campo.',
  output_schema = {
    preguntas_socraticas: 'array',
    trade_offs_identificados: 'array',
    evaluacion_decision: 'object',
    recomendaciones: 'array'
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

-- 5. HERRAMIENTAS DE ANÁLISIS Y EVALUACIÓN
UPDATE exercise_template:herramienta_analisis SET
  nombre = 'Herramienta de Análisis',
  categoria = 'herramienta_analisis',
  descripcion = 'Procesar trabajo del aprendiz y generar análisis estructurado con diagnóstico y recomendaciones',
  objetivo_pedagogico = 'Proporcionar evaluación rigurosa contra múltiples dimensiones con feedback accionable',
  rol_ia = 'Analista que identifica patrones no conscientes, evalúa contra múltiples dimensiones con evidencia, detecta gaps críticos, valida coherencia, mapea claims a evidencia, evalúa sofisticación de razonamiento',
  configuracion_schema = {
    type: 'object',
    properties: {
      dimensiones_evaluar: { type: 'array', items: { type: 'string' }, description: 'Dimensiones de evaluación' },
      criterios_calidad: { type: 'object', description: 'Criterios específicos de calidad' },
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
  prompt_template = 'Analiza el trabajo evaluando: {{dimensiones_evaluar}}. Aplica criterios: {{criterios_calidad}}{{#if generar_metricas}}. Genera métricas cuantitativas{{/if}}{{#if identificar_patrones}}. Identifica patrones recurrentes{{/if}}{{#if comparar_con_ejemplares}}. Compara con ejemplares{{/if}}. Proporciona diagnóstico descriptivo primero, evaluativo después, con feedback accionable.',
  output_schema = {
    diagnostico: 'object',
    evaluacion_dimensiones: 'object',
    metricas: 'object?',
    patrones_identificados: 'array?',
    gaps_criticos: 'array',
    recomendaciones_accionables: 'array'
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

-- 6. HERRAMIENTAS DE CREACIÓN Y GENERACIÓN
UPDATE exercise_template:herramienta_creacion SET
  nombre = 'Herramienta de Creación',
  categoria = 'herramienta_creacion',
  descripcion = 'Asistir en crear outputs proporcionando andamiaje generativo que acelera producción',
  objetivo_pedagogico = 'Acelerar ciclos de iteración sin reemplazar pensamiento crítico del aprendiz',
  rol_ia = 'Asistente creativo que traduce información en visualizaciones, genera borradores imperfectos que requieren refinamiento, crea variaciones para experimentación, produce escenarios coherentes y mantiene voz del aprendiz',
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
  prompt_template = 'Genera {{tipo_output}} en nivel {{nivel_completitud}}. Crea {{numero_variaciones}} variaciones genuinamente diferentes{{#if incluir_explicacion_logica}} con explicación de lógica de cada una{{/if}}{{#if mantener_voz_aprendiz}}. Mantén voz del aprendiz, no impongas voz genérica{{/if}}. Los borradores deben ser útiles pero deliberadamente imperfectos para forzar refinamiento.',
  output_schema = {
    variaciones: 'array',
    explicaciones_logica: 'object',
    sugerencias_refinamiento: 'array'
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

-- 7. SISTEMAS DE TRACKING Y MONITOREO
UPDATE exercise_template:sistema_tracking SET
  nombre = 'Sistema de Tracking',
  categoria = 'sistema_tracking',
  descripcion = 'Mantener visibilidad continua del progreso e identificar tendencias longitudinales',
  objetivo_pedagogico = 'Alertar proactivamente cuando atención o intervención es necesaria',
  rol_ia = 'Sistema de vigilancia inteligente que visualiza estado vs objetivos, solicita updates, detecta patrones problemáticos, contextualiza métricas, monitorea adherencia a proceso y dispara intervenciones',
  configuracion_schema = {
    type: 'object',
    properties: {
      metricas_seguimiento: { type: 'array', items: { type: 'string' }, description: 'Qué métricas trackear' },
      frecuencia_updates: { type: 'string', enum: ['diaria', 'semanal', 'por_hito'], default: 'semanal' },
      detectar_estancamiento: { type: 'boolean', default: true },
      detectar_frustration: { type: 'boolean', default: true },
      benchmarks: { type: 'object', description: 'Benchmarks de comparación' },
      disparar_intervenciones: { type: 'boolean', default: true }
    }
  },
  configuracion_default = {
    frecuencia_updates: 'semanal',
    detectar_estancamiento: true,
    detectar_frustration: true,
    disparar_intervenciones: true
  },
  prompt_template = 'Monitorea progreso tracking: {{metricas_seguimiento}}. Frecuencia: {{frecuencia_updates}}. Compara con benchmarks{{#if detectar_estancamiento}}. Detecta estancamiento o bloqueo{{/if}}{{#if detectar_frustration}}. Identifica señales de frustración{{/if}}{{#if disparar_intervenciones}}. Dispara intervenciones cuando aprendiz está genuinamente atascado{{/if}}. Celebra progreso para mantener motivación.',
  output_schema = {
    visualizacion_progreso: 'object',
    metricas_actuales: 'object',
    comparacion_benchmarks: 'object',
    patrones_detectados: 'array',
    alertas_intervencion: 'array?',
    proximos_pasos_criticos: 'array'
  },
  preview_config = {
    dashboard_interactivo: true,
    graficas_tendencias: true
  },
  icono = '📊',
  color = '#0ea5e9',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

-- 8. HERRAMIENTAS DE REVISIÓN Y FEEDBACK
UPDATE exercise_template:herramienta_revision SET
  nombre = 'Herramienta de Revisión',
  categoria = 'herramienta_revision',
  descripcion = 'Proporcionar retroalimentación formativa específica, accionable y balanceada',
  objetivo_pedagogico = 'Dar feedback adaptado al nivel de dominio que sea honesto pero motivador',
  rol_ia = 'Revisor experto que proporciona feedback no-intrusivo priorizando señalamientos, genera análisis comprehensivo comenzando con fortalezas, compara con ejemplares, adapta tipo/profundidad según estado liminal',
  configuracion_schema = {
    type: 'object',
    properties: {
      momento_feedback: { type: 'string', enum: ['tiempo_real', 'post_tarea', 'ambos'], default: 'ambos' },
      priorizar_señalamientos: { type: 'boolean', default: true, description: 'No abrumar con 20 cosas' },
      comenzar_con_fortalezas: { type: 'boolean', default: true },
      comparar_con_ejemplares: { type: 'boolean', default: true },
      adaptar_a_nivel_dominio: { type: 'boolean', default: true },
      incluir_recursos_mejora: { type: 'boolean', default: true }
    }
  },
  configuracion_default = {
    momento_feedback: 'ambos',
    priorizar_señalamientos: true,
    comenzar_con_fortalezas: true,
    comparar_con_ejemplares: true,
    adaptar_a_nivel_dominio: true,
    incluir_recursos_mejora: true
  },
  prompt_template = 'Proporciona feedback {{momento_feedback}}{{#if priorizar_señalamientos}}, priorizando 3-5 señalamientos clave (no abrumar){{/if}}{{#if comenzar_con_fortalezas}}. Comienza con fortalezas específicas{{/if}}{{#if comparar_con_ejemplares}}. Compara con ejemplares para hacer gaps accionables{{/if}}{{#if adaptar_a_nivel_dominio}}. Adapta profundidad según nivel de dominio{{/if}}{{#if incluir_recursos_mejora}}. Conecta feedback con recursos para mejorar{{/if}}. Balancea honestidad con motivación.',
  output_schema = {
    fortalezas_especificas: 'array',
    areas_mejora_priorizadas: 'array',
    comparacion_ejemplares: 'object?',
    feedback_accionable: 'array',
    recursos_recomendados: 'array?'
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
UPDATE exercise_template:simulador_entorno SET
  nombre = 'Simulador de Entorno',
  categoria = 'simulador_entorno',
  descripcion = 'Crear entornos virtuales donde experimentar sin consecuencias del mundo real',
  objetivo_pedagogico = 'Acelerar ciclos de aprendizaje mediante experimentación segura y múltiples intentos',
  rol_ia = 'Constructor de mundos simulados que responden realísticamente, generan datos sintéticos coherentes, proporcionan entornos de experimentación controlados, simulan resultados con variabilidad realista y explican relaciones causales',
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
  prompt_template = 'Simula {{tipo_entorno}} con fidelidad {{nivel_fidelidad}}. Responde realísticamente a acciones del aprendiz{{#if incluir_casos_edge}}, incluyendo casos edge y outliers{{/if}}{{#if permitir_multiples_intentos}}. Permite múltiples intentos sin penalización{{/if}}{{#if explicar_causas}}. Explica por qué el sistema respondió así, revelando relaciones causales{{/if}}{{#if mantener_log_experimentos}}. Mantén log para análisis posterior{{/if}}.',
  output_schema = {
    estado_entorno: 'object',
    respuesta_acciones: 'object',
    explicaciones_causales: 'object',
    log_experimentos: 'array?',
    resultados_simulados: 'object'
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

-- 10. SISTEMAS DE PROGRESIÓN Y DESBLOQUEO
UPDATE exercise_template:sistema_progresion SET
  nombre = 'Sistema de Progresión',
  categoria = 'sistema_progresion',
  descripcion = 'Gestionar flujo del aprendiz asegurando dominio suficiente antes de avanzar',
  objetivo_pedagogico = 'Personalizar ruta según fortalezas/debilidades manteniendo motivación mediante desbloqueos apropiados',
  rol_ia = 'Guardián pedagógico que evalúa objetivamente contra criterios de suficiencia, diagnostica estado de dominio, recomienda rutas adaptativas, verifica pre-requisitos, permite reintentos con diagnóstico claro y documenta evidencia de dominio',
  configuracion_schema = {
    type: 'object',
    properties: {
      criterios_suficiencia: { type: 'object', description: 'Criterios para permitir progresión' },
      umbrales_dominio: { type: 'object', description: 'Umbrales de dominio por concepto' },
      permitir_rutas_alternativas: { type: 'boolean', default: true },
      verificar_prerequisitos: { type: 'boolean', default: true },
      permitir_reintentos: { type: 'boolean', default: true },
      max_reintentos: { type: 'number', default: 3, minimum: 1 },
      diagnostico_entre_intentos: { type: 'boolean', default: true }
    }
  },
  configuracion_default = {
    permitir_rutas_alternativas: true,
    verificar_prerequisitos: true,
    permitir_reintentos: true,
    max_reintentos: 3,
    diagnostico_entre_intentos: true
  },
  prompt_template = 'Evalúa dominio contra criterios: {{criterios_suficiencia}} con umbrales: {{umbrales_dominio}}{{#if verificar_prerequisitos}}. Verifica rigurosamente pre-requisitos antes de desbloquear{{/if}}{{#if permitir_rutas_alternativas}}. Recomienda rutas adaptativas basadas en fortalezas/debilidades{{/if}}{{#if permitir_reintentos}}. Permite hasta {{max_reintentos}} reintentos{{#if diagnostico_entre_intentos}} con diagnóstico claro de qué falta entre intentos{{/if}}{{/if}}. Previene avance prematuro y estancamiento innecesario.',
  output_schema = {
    evaluacion_dominio: 'object',
    cumple_criterios: 'boolean',
    prerequisitos_verificados: 'boolean',
    diagnostico: 'object',
    ruta_recomendada: 'object?',
    contenido_desbloqueado: 'array',
    evidencia_dominio: 'object'
  },
  preview_config = {
    mostrar_arbol_progresion: true,
    indicar_bloqueados: true
  },
  icono = '🎯',
  color = '#a855f7',
  es_oficial = true,
  activo = true,
  created_at = time::now(),
  updated_at = time::now();

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que se crearon los 10 templates
SELECT count() AS total_templates FROM exercise_template WHERE activo = true GROUP ALL;

-- Listar todos los templates creados
SELECT id, nombre, categoria, icono FROM exercise_template WHERE activo = true ORDER BY categoria;
