-- Script para actualizar el schema del template "Cuaderno de Trabajo"
-- Este script actualiza el exercise_template:cuaderno_trabajo con el nuevo schema basado en secciones

UPDATE exercise_template:cuaderno_trabajo SET
  configuracion_schema = {
    type: 'object',
    properties: {
      secciones: {
        type: 'array',
        description: 'Define las secciones estructuradas del cuaderno.',
        items: {
          type: 'object',
          properties: {
            tituloSeccion: { type: 'string', description: 'Título o Enfoque (Ej: "Análisis del Problema")' },
            descripcionPrompt: { type: 'string', description: 'Descripción para la IA (¿Qué debe preguntar la IA?)' },
            criteriosPrompt: { type: 'string', description: 'Rúbrica para la IA (¿Qué debe evaluar la IA?)' }
          }
        }
      }
    }
  },
  configuracion_default = {
    secciones: []
  },
  prompt_template = 'Eres un diseñador instruccional experto creando un cuaderno de trabajo interactivo.\n\nCONTEXTO DEL PROGRAMA:\nPrograma: {{programa.nombre}}\nFase: {{fase.nombre}} - {{fase.descripcion}}\nProof Point: {{proof_point.pregunta_central}}\nDocumentación clave: {{proof_point.documentacion_contexto}}\n\nDOCUMENTACIÓN DE LA FASE:\n{{fase_documentation}}\n\nCONSIDERACIONES DEL INSTRUCTOR:\n{{consideraciones}}\n\nSECCIONES DEFINIDAS POR EL INSTRUCTOR:\n{{#each configuracion.secciones}}\n\nSección {{@index}}: {{tituloSeccion}}\n- Descripción/Objetivo: {{descripcionPrompt}}\n- Criterios de Evaluación: {{criteriosPrompt}}\n{{/each}}\n\nCONFIGURACIÓN:\nDuración objetivo: {{configuracion.duracion_minutos}} minutos\n\nREQUISITOS DE FORMATO:\nPara cada sección definida por el instructor, genera preguntas específicas (prompts) que guíen al estudiante.\n\nEl contenido debe seguir esta estructura JSON:\n{\n  "titulo": string,\n  "objetivo": string,\n  "contexto": string,\n  "secciones": [{\n    "titulo": string,\n    "descripcion": string,\n    "instrucciones": string,\n    "criteriosDeEvaluacion": string[],\n    "prompts": [{\n      "tipo": "texto_corto"|"texto_largo"|"lista"|"tabla"|"reflexion",\n      "pregunta": string,\n      "guia": string,\n      "min_palabras"?: number,\n      "max_palabras"?: number,\n      "placeholder"?: string,\n      "criteriosDeEvaluacion": string[]\n    }]\n  }],\n  "criterios_evaluacion": string[],\n  "tiempo_sugerido": number\n}\n\nIMPORTANTE:\n- Cada sección del cuaderno debe corresponder a una sección definida por el instructor\n- Usa la "descripcionPrompt" para entender qué preguntas generar\n- Usa los "criteriosPrompt" para definir los criteriosDeEvaluacion de cada pregunta\n- Los criteriosDeEvaluacion deben ser específicos, medibles y estar alineados con la rúbrica definida por el instructor\n- Crea entre 2-5 prompts por sección según su complejidad\n- Devuelve únicamente JSON válido',
  updated_at = time::now();

-- Verificar que se actualizó correctamente
SELECT id, nombre, configuracion_schema, configuracion_default FROM exercise_template:cuaderno_trabajo;
