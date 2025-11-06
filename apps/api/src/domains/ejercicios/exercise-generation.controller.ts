import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ExerciseGenerationService,
  GenerateExerciseDto,
} from './exercise-generation.service';

// TODO: Importar guards de autenticación cuando estén disponibles
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard';
// import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('exercise-generation')
// @UseGuards(JwtAuthGuard, RolesGuard) // Descomentar cuando esté disponible
export class ExerciseGenerationController {
  private readonly logger = new Logger(ExerciseGenerationController.name);

  constructor(
    private readonly generationService: ExerciseGenerationService,
  ) {}

  /**
   * POST /exercise-generation/:instanceId
   * Genera contenido con IA para una instancia específica de ejercicio.
   *
   * Este endpoint:
   * 1. Obtiene el template y configuración del ejercicio
   * 2. Construye el contexto (programa, fase, proof point, documentación)
   * 3. Interpola el prompt del template
   * 4. Llama a OpenAI
   * 5. Crea el ExerciseContent con el resultado
   */
  @Post(':instanceId')
  @HttpCode(HttpStatus.CREATED)
  // @Roles('instructor', 'admin')
  async generateExercise(
    @Param('instanceId') instanceId: string,
    @Request() req: any, // TODO: Tipar correctamente cuando auth esté implementado
  ) {
    // TODO: Obtener userId del token JWT cuando auth esté implementado
    const userId = req.user?.id || 'user:temp'; // Temporal

    this.logger.log(`Iniciando generación de ejercicio: ${instanceId}`);

    const content = await this.generationService.generateExerciseContent({
      exerciseInstanceId: instanceId,
      userId,
    });

    return {
      success: true,
      data: content,
      message: 'Ejercicio generado exitosamente',
    };
  }

  /**
   * POST /exercise-generation/proof-point/:proofPointId/batch
   * Genera contenido con IA para todos los ejercicios de un proof point que no tienen contenido.
   *
   * Este endpoint es útil para el instructor cuando quiere generar todos los ejercicios
   * de un proof point de una sola vez en lugar de uno por uno.
   */
  @Post('proof-point/:proofPointId/batch')
  @HttpCode(HttpStatus.CREATED)
  // @Roles('instructor', 'admin')
  async generateBatchForProofPoint(
    @Param('proofPointId') proofPointId: string,
    @Request() req: any,
  ) {
    // TODO: Obtener userId del token JWT cuando auth esté implementado
    const userId = req.user?.id || 'user:temp'; // Temporal

    this.logger.log(
      `Iniciando generación batch para proof point: ${proofPointId}`,
    );

    const results = await this.generationService.generateBatchForProofPoint(
      proofPointId,
      userId,
    );

    return {
      success: true,
      data: results,
      count: results.length,
      message: `${results.length} ejercicio(s) generado(s) exitosamente`,
    };
  }
}
