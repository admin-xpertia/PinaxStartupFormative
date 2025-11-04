import { VisualRoadmapBuilder } from "@/components/fase2/visual-roadmap-builder"

const mockPrograma = {
  id: "prog_001",
  nombre: "Xpertia Emprendedor",
  descripcion: "Programa de emprendimiento basado en validación incremental",
  fases: [
    {
      id: "fase_001",
      numero: 1,
      nombre: "Proof Points Fundamentales",
      descripcion: "Validación inicial del problema y solución",
      objetivos_aprendizaje: ["Identificar problema real", "Validar solución"],
      duracion_semanas: 4,
      numero_proof_points: 2,
      documentacion_completa: true,
      proof_points: [
        {
          id: "pp_001",
          nombre: "Customer-Solution Fit",
          slug: "customer-solution-fit",
          descripcion: "Validar que la solución resuelve el problema",
          pregunta_central: "¿Tu solución resuelve un problema real?",
          tipo_entregable: "Canvas validado",
          numero_niveles: 3,
          prerequisitos: [],
          duracion_estimada_horas: 8,
          niveles: [
            {
              id: "nivel_001",
              numero: 1,
              nombre: "Identificación",
              objetivo_especifico: "Identificar el problema",
              componentes: [
                {
                  id: "comp_001",
                  tipo: "leccion" as const,
                  nombre: "Introducción al Customer-Solution Fit",
                  descripcion: "Conceptos básicos",
                  duracion_minutos: 30,
                  es_evaluable: false,
                  contenido_listo: true,
                },
              ],
              criterio_completacion: {
                tipo: "simple" as const,
              },
            },
          ],
        },
        {
          id: "pp_002",
          nombre: "Problem Validation",
          slug: "problem-validation",
          descripcion: "Validar que el problema existe",
          pregunta_central: "¿El problema es real y relevante?",
          tipo_entregable: "Entrevistas documentadas",
          numero_niveles: 2,
          prerequisitos: ["pp_001"],
          duracion_estimada_horas: 6,
          niveles: [],
        },
      ],
    },
    {
      id: "fase_002",
      numero: 2,
      nombre: "Validación de Mercado",
      descripcion: "Validar el mercado objetivo",
      objetivos_aprendizaje: ["Definir segmento", "Validar demanda"],
      duracion_semanas: 3,
      numero_proof_points: 1,
      documentacion_completa: false,
      proof_points: [
        {
          id: "pp_003",
          nombre: "Market Sizing",
          slug: "market-sizing",
          descripcion: "Dimensionar el mercado",
          pregunta_central: "¿Cuál es el tamaño del mercado?",
          tipo_entregable: "Análisis de mercado",
          numero_niveles: 2,
          prerequisitos: ["pp_002"],
          duracion_estimada_horas: 10,
          niveles: [],
        },
      ],
    },
  ],
}

export default function ArquitecturaPage({ params }: { params: { id: string } }) {
  const handleUpdate = async (updatedPrograma: any) => {
    console.log("[v0] Updating programa:", updatedPrograma)
    // TODO: Implement API call to update programa
  }

  return (
    <div className="h-screen">
      <VisualRoadmapBuilder programaId={params.id} programa={mockPrograma} onUpdate={handleUpdate} readonly={false} />
    </div>
  )
}
