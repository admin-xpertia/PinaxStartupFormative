import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { SurrealDbService } from "src/core/database";
import { CrearRubricaDto, ValidarPesosDto } from "./dto";

@Injectable()
export class RubricaService {
  private readonly logger = new Logger(RubricaService.name);

  constructor(private readonly surrealDb: SurrealDbService) {}

  /**
   * Crea una nueva rúbrica de evaluación para un componente.
   *
   * VALIDACIONES:
   * 1. El componente debe existir.
   * 2. Las dimensiones deben tener pesos que sumen 100 (si pesosValidados = true).
   * 3. Los descriptores de cada dimensión deben tener puntos válidos.
   */
  async crearRubrica(dto: CrearRubricaDto) {
    const { componenteId, dimensiones, pesosValidados } = dto;

    // 1. Validar que el componente existe
    const componente = await this.obtenerComponente(componenteId);

    if (!componente) {
      throw new NotFoundException(`Componente ${componenteId} no encontrado`);
    }

    // 2. Validar que los pesos suman 100 (si se solicita validación)
    if (pesosValidados) {
      this.validarSumaPesos(dimensiones);
    }

    // 3. Validar que cada dimensión tiene descriptores válidos
    this.validarDescriptores(dimensiones);

    // 4. Crear la rúbrica en la base de datos
    const query = `
      CREATE rubrica_evaluacion CONTENT {
        componente: type::thing("componente", $componenteId),
        dimensiones: $dimensiones,
        pesos_validados: $pesosValidados
      }
      RETURN *;
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      componenteId: this.extractId(componenteId),
      dimensiones: dimensiones,
      pesosValidados: pesosValidados ?? false,
    });

    const rubrica = result?.[0];

    if (!rubrica || !rubrica.id) {
      throw new BadRequestException("No se pudo crear la rúbrica");
    }

    this.logger.log(
      `Rúbrica creada exitosamente para componente ${componenteId}`,
    );

    return rubrica;
  }

  /**
   * Obtiene la rúbrica de un componente.
   */
  async obtenerRubrica(componenteId: string) {
    const query = `
      SELECT * FROM rubrica_evaluacion
      WHERE componente = type::thing("componente", $componenteId);
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      componenteId: this.extractId(componenteId),
    });

    const rubrica = result?.[0];

    if (!rubrica) {
      throw new NotFoundException(
        `No existe rúbrica para el componente ${componenteId}`,
      );
    }

    return rubrica;
  }

  /**
   * Actualiza una rúbrica existente.
   */
  async actualizarRubrica(rubricaId: string, dto: Partial<CrearRubricaDto>) {
    const { dimensiones, pesosValidados } = dto;

    // Validar que la rúbrica existe
    const rubricaExistente = await this.obtenerRubricaPorId(rubricaId);

    if (!rubricaExistente) {
      throw new NotFoundException(`Rúbrica ${rubricaId} no encontrada`);
    }

    // Validar pesos si se proporcionaron dimensiones
    if (dimensiones && pesosValidados) {
      this.validarSumaPesos(dimensiones);
    }

    if (dimensiones) {
      this.validarDescriptores(dimensiones);
    }

    // Actualizar la rúbrica
    const query = `
      UPDATE type::thing("rubrica_evaluacion", $rubricaId)
      SET
        dimensiones = $dimensiones ?? dimensiones,
        pesos_validados = $pesosValidados ?? pesos_validados
      RETURN *;
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      rubricaId: this.extractId(rubricaId),
      dimensiones: dimensiones || null,
      pesosValidados: pesosValidados ?? null,
    });

    this.logger.log(`Rúbrica ${rubricaId} actualizada exitosamente`);

    return result?.[0];
  }

  /**
   * Elimina una rúbrica.
   */
  async eliminarRubrica(rubricaId: string) {
    const query = `
      DELETE type::thing("rubrica_evaluacion", $rubricaId);
    `;

    await this.surrealDb.query(query, {
      rubricaId: this.extractId(rubricaId),
    });

    this.logger.log(`Rúbrica ${rubricaId} eliminada exitosamente`);

    return {
      mensaje: "Rúbrica eliminada exitosamente",
      rubricaId,
    };
  }

  /**
   * Valida que los pesos de las dimensiones suman 100.
   * Si el margen de error es mayor a 0.01, lanza una excepción.
   */
  async validarPesos(dto: ValidarPesosDto) {
    const { rubricaId } = dto;

    const rubrica = await this.obtenerRubricaPorId(rubricaId);

    if (!rubrica) {
      throw new NotFoundException(`Rúbrica ${rubricaId} no encontrada`);
    }

    try {
      this.validarSumaPesos(rubrica.dimensiones);

      // Actualizar el flag de validación
      await this.marcarPesosValidados(rubricaId, true);

      return {
        valido: true,
        mensaje: "Los pesos suman correctamente 100",
      };
    } catch (error) {
      await this.marcarPesosValidados(rubricaId, false);

      return {
        valido: false,
        mensaje: error instanceof Error ? error.message : "Error de validación",
      };
    }
  }

  /**
   * Evalúa un entregable usando la rúbrica del componente.
   * Retorna el puntaje total y el desglose por dimensión.
   *
   * NOTA: Esta es una implementación básica. En una implementación real,
   * podrías integrar IA para evaluar automáticamente basándose en los descriptores.
   */
  async evaluarConRubrica(
    componenteId: string,
    evaluacion: Record<string, string>, // { dimensionNombre: nivelSeleccionado }
  ) {
    const rubrica = await this.obtenerRubrica(componenteId);

    const resultados: any[] = [];
    let puntajeTotal = 0;

    for (const dimension of rubrica.dimensiones) {
      const nivelSeleccionado = evaluacion[dimension.nombre];

      if (!nivelSeleccionado) {
        throw new BadRequestException(
          `Falta evaluación para la dimensión: ${dimension.nombre}`,
        );
      }

      // Buscar el descriptor correspondiente
      const descriptor = dimension.descriptores.find(
        (d: any) => d.nivel === nivelSeleccionado,
      );

      if (!descriptor) {
        throw new BadRequestException(
          `Nivel ${nivelSeleccionado} no válido para dimensión ${dimension.nombre}`,
        );
      }

      // Calcular puntaje ponderado
      const puntajeDimension = (descriptor.puntos * dimension.peso) / 100;
      puntajeTotal += puntajeDimension;

      resultados.push({
        dimension: dimension.nombre,
        nivel: nivelSeleccionado,
        puntos: descriptor.puntos,
        peso: dimension.peso,
        puntajePonderado: puntajeDimension,
      });
    }

    return {
      rubricaId: rubrica.id,
      puntajeTotal: Math.round(puntajeTotal * 100) / 100, // Redondear a 2 decimales
      resultados,
    };
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  private async obtenerComponente(componenteId: string) {
    const query = `
      SELECT * FROM type::thing("componente", $componenteId);
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      componenteId: this.extractId(componenteId),
    });

    return result?.[0];
  }

  private async obtenerRubricaPorId(rubricaId: string) {
    const query = `
      SELECT * FROM type::thing("rubrica_evaluacion", $rubricaId);
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      rubricaId: this.extractId(rubricaId),
    });

    return result?.[0];
  }

  private async marcarPesosValidados(rubricaId: string, validado: boolean) {
    const query = `
      UPDATE type::thing("rubrica_evaluacion", $rubricaId)
      SET pesos_validados = $validado
      RETURN *;
    `;

    await this.surrealDb.query(query, {
      rubricaId: this.extractId(rubricaId),
      validado,
    });
  }

  /**
   * Valida que los pesos de las dimensiones suman 100 (con margen de error de 0.01).
   */
  private validarSumaPesos(dimensiones: any[]) {
    const sumaPesos = dimensiones.reduce(
      (sum, dim) => sum + (dim.peso || 0),
      0,
    );

    const margenError = 0.01;

    if (Math.abs(sumaPesos - 100) > margenError) {
      throw new BadRequestException(
        `Los pesos de las dimensiones deben sumar 100. Suma actual: ${sumaPesos}`,
      );
    }
  }

  /**
   * Valida que cada dimensión tenga al menos un descriptor y que los puntos estén en rango válido.
   */
  private validarDescriptores(dimensiones: any[]) {
    for (const dimension of dimensiones) {
      if (!dimension.descriptores || dimension.descriptores.length === 0) {
        throw new BadRequestException(
          `La dimensión ${dimension.nombre} debe tener al menos un descriptor`,
        );
      }

      for (const descriptor of dimension.descriptores) {
        if (descriptor.puntos < 0 || descriptor.puntos > 100) {
          throw new BadRequestException(
            `Los puntos del descriptor deben estar entre 0 y 100. Descriptor: ${descriptor.nivel}`,
          );
        }
      }
    }
  }

  private extractId(recordId: string): string {
    if (!recordId) {
      throw new BadRequestException("ID inválido");
    }

    const parts = recordId.split(":");
    return parts.length > 1 ? parts[parts.length - 1] : recordId;
  }
}
