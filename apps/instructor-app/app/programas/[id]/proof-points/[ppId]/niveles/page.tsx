"use client"

import { use } from "react"
import { NivelConfigurator } from "@/components/fase2/nivel-configurator"
import type { Nivel } from "@/types/fase"
import { useRouter } from "next/navigation"

// Mock data para testing
const mockNiveles: Nivel[] = [
  {
    id: "nivel_001",
    numero: 0,
    nombre: "Fundamentos del CSF",
    objetivo_especifico: "Comprender qué es CSF y por qué es crítico",
    componentes: [
      {
        id: "comp_001",
        tipo: "leccion",
        nombre: "Introducción al CSF",
        descripcion: "Aprende qué es el Customer-Solution Fit",
        duracion_minutos: 15,
        es_evaluable: false,
        contenido_listo: true,
      },
      {
        id: "comp_002",
        tipo: "cuaderno",
        nombre: "Cuaderno de Hipótesis",
        descripcion: "Formula tus primeras hipótesis de CSF",
        duracion_minutos: 30,
        es_evaluable: true,
        contenido_listo: true,
      },
    ],
    criterio_completacion: {
      tipo: "simple",
    },
  },
]

export default function NivelesPage({
  params,
}: {
  params: Promise<{ id: string; ppId: string }>
}) {
  const { id: programaId, ppId: proofPointId } = use(params)
  const router = useRouter()

  const handleSave = async (niveles: Nivel[]) => {
    console.log("[v0] Guardando niveles:", niveles)
    // Aquí iría la llamada a la API
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleClose = () => {
    router.back()
  }

  return (
    <NivelConfigurator
      programaId={programaId}
      proofPointId={proofPointId}
      proofPointNombre="Validar Customer-Solution Fit"
      nivelesExistentes={mockNiveles}
      onSave={handleSave}
      onClose={handleClose}
    />
  )
}
