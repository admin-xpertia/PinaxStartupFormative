import type { EstudianteDetallado } from "@/types/student"

export const mockStudentDetail: EstudianteDetallado = {
  id: "est_001",
  nombre: "María González",
  email: "maria.gonzalez@email.com",
  avatar_url: "/avatar-woman-1.png",
  estado: "activo",
  fecha_invitacion: "2024-01-15",
  fecha_primer_acceso: "2024-01-16",
  ultima_actividad: "2024-03-10T14:35:00",
  progreso_general: 68,
  componentes_completados: 17,
  componentes_totales: 25,
  score_promedio: 8.4,
  tiempo_total_horas: 42.5,
  alertas: [],
  extensiones_activas: [],

  progreso_detallado: {
    fases: [
      {
        id: "fase_1",
        numero: 1,
        nombre: "Fundamentos de Validación",
        progreso: 100,
        estado: "completado",
        proof_points: [
          {
            id: "pp_1_1",
            nombre: "Problema-Solución Fit",
            estado: "completado",
            score: 9.2,
            fecha_completacion: "2024-02-05",
            niveles: [
              {
                id: "nivel_1",
                nombre: "Nivel 1: Conceptos Base",
                componentes: [
                  {
                    id: "comp_1",
                    tipo: "leccion",
                    nombre: "Introducción al Problem-Solution Fit",
                    estado: "completado",
                    score: 9.5,
                    tiempo_min: 25,
                  },
                  {
                    id: "comp_2",
                    tipo: "cuaderno",
                    nombre: "Reflexión: Tu Problema",
                    estado: "completado",
                    score: 8.8,
                    tiempo_min: 45,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "fase_2",
        numero: 2,
        nombre: "Validación con Clientes",
        progreso: 65,
        estado: "en_progreso",
        proof_points: [
          {
            id: "pp_2_1",
            nombre: "Entrevistas de Descubrimiento",
            estado: "en_progreso",
            niveles: [
              {
                id: "nivel_1",
                nombre: "Nivel 1: Preparación",
                componentes: [
                  {
                    id: "comp_3",
                    tipo: "leccion",
                    nombre: "Cómo Diseñar Entrevistas Efectivas",
                    estado: "completado",
                    score: 8.2,
                    tiempo_min: 30,
                  },
                  {
                    id: "comp_4",
                    tipo: "simulacion",
                    nombre: "Simulación: Primera Entrevista",
                    estado: "en_progreso",
                    tiempo_min: 15,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "fase_3",
        numero: 3,
        nombre: "Prototipado y Testing",
        progreso: 0,
        estado: "bloqueado",
        proof_points: [],
      },
    ],
  },

  timeline_actividad: [
    {
      timestamp: "2024-03-10T14:35:00",
      tipo: "completado",
      descripcion: "Completó Lección: Cómo Diseñar Entrevistas Efectivas",
      detalles: { tiempo: "18 min", score: 8.2 },
    },
    {
      timestamp: "2024-03-10T10:22:00",
      tipo: "guardado",
      descripcion: "Guardó progreso en Cuaderno: Reflexión sobre Entrevistas",
      detalles: { seccion: "Sección 3", palabras: 450 },
    },
    {
      timestamp: "2024-03-09T16:45:00",
      tipo: "completado",
      descripcion: "Completó Simulación: Primera Entrevista",
      detalles: { tiempo: "22 min", score: 7.8 },
    },
  ],

  artefactos: [
    {
      id: "art_1",
      titulo: "Análisis de Problema-Solución",
      tipo: "reporte",
      fecha: "2024-02-05",
      score: 9.2,
      thumbnail: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "art_2",
      titulo: "Reflexión: Mi Problema de Negocio",
      tipo: "cuaderno",
      fecha: "2024-02-10",
      score: 8.8,
    },
    {
      id: "art_3",
      titulo: "Plan de Entrevistas",
      tipo: "reporte",
      fecha: "2024-03-05",
      score: 8.5,
    },
  ],

  scores_detallados: [
    {
      componente: "Introducción al Problem-Solution Fit",
      tipo: "Lección",
      score: 9.5,
      percentil: "Top 10%",
      fecha: "2024-02-05",
      intentos: 1,
      feedback: "Excelente comprensión de los conceptos fundamentales",
      areas_fuertes: ["Identificación de problemas", "Análisis de soluciones"],
      areas_mejora: ["Validación cuantitativa"],
    },
    {
      componente: "Reflexión: Tu Problema",
      tipo: "Cuaderno",
      score: 8.8,
      percentil: "Top 20%",
      fecha: "2024-02-10",
      intentos: 1,
      areas_fuertes: ["Profundidad de análisis", "Ejemplos concretos"],
      areas_mejora: ["Conexión con métricas"],
    },
  ],

  fortalezas: [
    {
      texto: "Excelente capacidad de análisis crítico",
      evidencia: "Scores consistentemente altos en componentes de reflexión (promedio 8.8/10)",
    },
    {
      texto: "Aplicación práctica de conceptos",
      evidencia: "Artefactos muestran conexión directa con su proyecto real",
    },
  ],

  debilidades: [
    {
      texto: "Dificultad con validación cuantitativa",
      evidencia: "Score de 7.2 en componentes relacionados con métricas",
      accion_sugerida: "Revisar lección sobre KPIs y métricas de validación",
    },
  ],

  patron_estudio: {
    heatmap: [
      { dia: 1, hora: 14, minutos: 45 },
      { dia: 1, hora: 15, minutos: 60 },
      { dia: 2, hora: 10, minutos: 30 },
      { dia: 3, hora: 14, minutos: 90 },
      { dia: 3, hora: 16, minutos: 45 },
      { dia: 4, hora: 14, minutos: 60 },
      { dia: 4, hora: 15, minutos: 30 },
    ],
    insights: [
      "Más activo Martes y Jueves 14:00-17:00",
      "Promedio 3.5 hrs/semana",
      "Mayor productividad en sesiones 45-60 min",
    ],
  },

  proximos_pasos: [
    {
      tipo: "accion_recomendada",
      componente: "Simulación: Primera Entrevista",
      razon: "Próximo en secuencia",
      estimado: "~45 min",
    },
    {
      tipo: "repaso_sugerido",
      componente: "Lección: Métricas de Validación",
      razon: "Score bajo en componente relacionado",
      estimado: "~30 min",
    },
  ],
}
