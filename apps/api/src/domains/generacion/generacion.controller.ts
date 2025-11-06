import {
  Body,
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "src/core/guards/auth.guard";
import { ProgramOwnershipGuard } from "../programas/guards/program-ownership.guard";
import { GeneracionService } from "./generacion.service";
import { GenerationConfigDto } from "./dto";
import { User } from "src/core/decorators";

/**
 * Controlador para gestionar la generación de contenido con IA
 *
 * IMPORTANTE:
 * - Todos los endpoints están protegidos por AuthGuard
 * - El endpoint de generación es SÍNCRONO y puede tomar 30-90 segundos
 * - Se recomienda configurar timeouts apropiados en el cliente
 */
@Controller("generacion")
@UseGuards(AuthGuard)
export class GeneracionController {
  private readonly logger = new Logger(GeneracionController.name);

  constructor(private readonly generacionService: GeneracionService) {}

  /**
   * Endpoint síncrono para generar contenido con IA
   *
   * CRÍTICO: Esta llamada es SÍNCRONA y puede tomar entre 30-90 segundos.
   * El servidor esperará a que OpenAI complete la generación antes de responder.
   *
   * @param config - Configuración de generación (contexto + preferencias)
   * @param userId - ID del usuario autenticado (inyectado por AuthGuard)
   * @returns El contenido generado con su análisis de calidad
   *
   * @throws BadRequestException si la configuración es inválida
   * @throws InternalServerErrorException si OpenAI falla o la BD falla
   *
   * POST /api/v1/generacion/componente
   * Authorization: Bearer <token>
   * Body: GenerationConfigDto
   */
  @Post("componente")
  @UseGuards(ProgramOwnershipGuard)
  async generarContenido(
    @Body() config: GenerationConfigDto,
    @User("id") userId: string,
  ) {
    this.logger.log(
      `Iniciando generación de contenido para componente: ${config.componenteId}`,
    );
    this.logger.debug(`Usuario: ${userId}, Tipo: ${config.tipo_componente}`);

    try {
      // Esta llamada AHORA es síncrona.
      // NestJS esperará a que generacionService termine.
      // Esto podría tomar 30-90 segundos.
      const resultado = await this.generacionService.generateContent(
        config,
        userId,
      );

      this.logger.log(
        `Contenido generado exitosamente para componente: ${config.componenteId}`,
      );

      return resultado; // Devuelve el JSON con el contenido y el análisis
    } catch (error: any) {
      this.logger.error(
        `Error al generar contenido para componente ${config.componenteId}:`,
        error,
      );

      // Manejar errores de OpenAI (ej. contenido filtrado, API caída)
      if (error instanceof InternalServerErrorException) {
        throw error; // Re-lanzar errores ya formateados del servicio
      }

      // Errores inesperados
      throw new InternalServerErrorException(
        `Error al generar contenido: ${error.message || "Error desconocido"}`,
      );
    }
  }
}
