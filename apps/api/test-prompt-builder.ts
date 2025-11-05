/**
 * Script de prueba para el método _buildPrompt
 *
 * Este script permite probar el prompt generado sin hacer llamadas a OpenAI
 * Para ejecutar: npx ts-node test-prompt-builder.ts
 */

import type { FaseDocumentation } from "@xpertia/types/fase";
import { TipoComponente } from "./src/domains/generacion/dto/generation-config.dto";

// Datos de prueba: GenerationConfigDto
const mockConfig = {
  faseId: "fase:test123",
  componenteId: "componente:test456",
  programa_nombre: "Programa de Innovación Empresarial",
  fase_nombre: "Fase 2 - Validación de Mercado",
  proof_point_nombre: "MVP Inicial",
  proof_point_pregunta: "¿Cómo validarías tu hipótesis de mercado con recursos limitados?",
  nivel_nombre: "Nivel 1 - Fundamentos",
  nivel_objetivo: "Comprender la importancia de validar hipótesis de mercado antes de invertir recursos significativos",
  tipo_componente: TipoComponente.LECCION,
  nombre_componente: "Introducción al Minimum Viable Product (MVP)",
  nivel_profundidad: 3,
  estilo_narrativo: "conversacional" as any,
  duracion_target: 30,
  conceptos_enfatizar: ["MVP", "validación de hipótesis", "feedback temprano"],
  casos_incluir: ["Dropbox", "Zappos"],
  elementos_incluir: ["ejemplos prácticos", "ejercicios de reflexión"],
  instrucciones_adicionales: "Enfócate en startups tech con recursos limitados. Usa ejemplos del mundo real.",
  modelo_ia: "gpt-4o",
  temperatura: 0.7,
};

// Datos de prueba: FaseDocumentation
const mockDocumentation: FaseDocumentation = {
  fase_id: "fase:test123",
  contexto: `En esta fase, los estudiantes aprenden a validar sus ideas de negocio de forma sistemática.
El objetivo principal es evitar el desperdicio de recursos en soluciones que el mercado no necesita.
Utilizaremos el framework Lean Startup como guía metodológica.`,
  conceptos_clave: [
    {
      id: "ck1",
      nombre: "Minimum Viable Product (MVP)",
      definicion: "La versión más simple de un producto que permite aprender el máximo sobre los clientes con el mínimo esfuerzo",
      ejemplo: "El primer MVP de Dropbox fue un video explicativo de 3 minutos que validó el interés antes de construir el producto",
      terminos_relacionados: ["producto", "validación", "iteración"],
    },
    {
      id: "ck2",
      nombre: "Hipótesis de Valor",
      definicion: "Suposición sobre por qué un cliente encontraría valor en tu solución",
      ejemplo: "Los emprendedores necesitan una forma simple de compartir archivos grandes entre equipos distribuidos",
      terminos_relacionados: ["propuesta de valor", "problema", "solución"],
    },
    {
      id: "ck3",
      nombre: "Build-Measure-Learn",
      definicion: "Ciclo iterativo de creación, medición de métricas y aprendizaje validado",
      ejemplo: "Zappos validó su hipótesis comprando zapatos en tiendas y enviándolos cuando alguien compraba en su web",
      terminos_relacionados: ["iteración", "feedback", "aprendizaje validado"],
    },
  ],
  casos_estudio: [
    {
      id: "ce1",
      titulo: "El Video MVP de Dropbox",
      tipo: "exito",
      descripcion: "Drew Houston creó un video de 3 minutos explicando Dropbox antes de construir el producto. El video generó 75,000 registros en la lista de espera en una noche, validando el interés sin escribir código complejo.",
      fuente: "https://techcrunch.com/2011/10/19/dropbox-minimal-viable-product/",
      conceptos_ilustrados: ["MVP", "validación temprana"],
    },
    {
      id: "ce2",
      titulo: "El Concierge MVP de Zappos",
      tipo: "exito",
      descripcion: "Nick Swinmurn validó la hipótesis de venta de zapatos online fotografiando zapatos en tiendas locales y solo comprándolos cuando alguien ordenaba en su web. Pérdida de dinero a corto plazo pero validación rápida del modelo.",
      fuente: "https://www.startupgrind.com/blog/the-zappos-story/",
      conceptos_ilustrados: ["validación de hipótesis", "feedback temprano"],
    },
  ],
  errores_comunes: [
    {
      id: "ec1",
      titulo: "Construir demasiado antes de validar",
      explicacion: "Muchos emprendedores pasan meses o años construyendo un producto completo sin validar si alguien lo quiere",
      como_evitar: "Define tu hipótesis de valor más riesgosa y diseña un experimento mínimo para probarla en semanas, no meses",
    },
    {
      id: "ec2",
      titulo: "Confundir MVP con producto mediocre",
      explicacion: "MVP no significa producto de baja calidad, sino el mínimo necesario para aprender",
      como_evitar: "Enfócate en una experiencia excelente para una característica core, no en 100 características mediocres",
    },
  ],
  recursos_referencia: [
    {
      id: "rr1",
      titulo: "The Lean Startup",
      tipo: "libro",
      url: "https://www.amazon.com/Lean-Startup-Eric-Ries/dp/0307887898",
      notas: "El libro fundamental sobre validación de startups",
    },
    {
      id: "rr2",
      titulo: "Running Lean",
      tipo: "libro",
      url: "https://www.amazon.com/Running-Lean-Iterate-Works-OReilly/dp/1449305172",
      notas: "Guía práctica para implementar Lean Startup",
    },
  ],
  criterios_evaluacion: [
    {
      id: "crit1",
      nombre: "Identificación de hipótesis",
      descriptor: "Capacidad de articular claramente las hipótesis riesgosas de su idea de negocio",
      nivel_importancia: "critico",
    },
    {
      id: "crit2",
      nombre: "Diseño de experimentos MVP",
      descriptor: "Habilidad para diseñar experimentos mínimos que validen hipótesis específicas",
      nivel_importancia: "critico",
    },
    {
      id: "crit3",
      nombre: "Interpretación de resultados",
      descriptor: "Capacidad de extraer aprendizajes accionables de los experimentos realizados",
      nivel_importancia: "importante",
    },
  ],
  completitud: 0.9,
};

// Simulación simplificada del método _buildPrompt
function buildPrompt(config: typeof mockConfig, doc: FaseDocumentation | null): string {
  const promptParts: string[] = [];

  promptParts.push(
    `Eres "Xpertia-AI", un diseñador instruccional experto de clase mundial y un especialista en el dominio de ${config.programa_nombre}.`,
  );

  promptParts.push(
    `# CONTEXTO DEL COMPONENTE
Estás generando un componente de aprendizaje dentro de la siguiente estructura:
- **Programa:** ${config.programa_nombre}
- **Fase:** ${config.fase_nombre} (ID: ${config.faseId})
- **Proof Point:** ${config.proof_point_nombre}
  - Pregunta Central: "${config.proof_point_pregunta}"
- **Nivel:** ${config.nivel_nombre}
  - Objetivo Específico: "${config.nivel_objetivo}"
- **Componente a Generar:** ${config.nombre_componente}`,
  );

  if (doc) {
    promptParts.push(
      `# CONOCIMIENTO DEL INSTRUCTOR
${doc.contexto}

## Conceptos Clave:
${doc.conceptos_clave.map((c, i) => `${i + 1}. **${c.nombre}**: ${c.definicion}\n   Ejemplo: ${c.ejemplo}`).join("\n\n")}

## Casos de Estudio:
${doc.casos_estudio.map((c, i) => `${i + 1}. **${c.titulo}** (${c.tipo})\n   ${c.descripcion}`).join("\n\n")}`,
    );
  }

  promptParts.push(
    `# TAREA DE GENERACIÓN
Genera una ${config.tipo_componente} llamada "${config.nombre_componente}"
- Duración: ${config.duracion_target} minutos
- Profundidad: ${config.nivel_profundidad}/5
- Estilo: ${config.estilo_narrativo}`,
  );

  return promptParts.join("\n\n");
}

// Ejecutar prueba
console.log("=".repeat(80));
console.log("PRUEBA DE CONSTRUCCIÓN DE PROMPT");
console.log("=".repeat(80));
console.log();

const generatedPrompt = buildPrompt(mockConfig, mockDocumentation);

console.log(generatedPrompt);
console.log();
console.log("=".repeat(80));
console.log(`Longitud del prompt: ${generatedPrompt.length} caracteres`);
console.log(`Tokens estimados: ~${Math.ceil(generatedPrompt.length / 4)}`);
console.log("=".repeat(80));
console.log();
console.log("✅ Prompt generado exitosamente");
console.log();
console.log("SIGUIENTE PASO:");
console.log("1. Copia el prompt generado");
console.log("2. Ve al OpenAI Playground (https://platform.openai.com/playground)");
console.log("3. Pega el prompt y prueba con gpt-4o o gpt-4o-mini");
console.log("4. Verifica que el JSON generado sigue el esquema esperado");
