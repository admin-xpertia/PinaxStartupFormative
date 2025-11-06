import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ExerciseInstancesService,
  CreateExerciseInstanceDto,
  UpdateExerciseInstanceDto,
} from './exercise-instances.service';

// TODO: Importar guards de autenticación cuando estén disponibles
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard';
// import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('exercise-instances')
// @UseGuards(JwtAuthGuard, RolesGuard) // Descomentar cuando esté disponible
export class ExerciseInstancesController {
  private readonly logger = new Logger(ExerciseInstancesController.name);

  constructor(
    private readonly instancesService: ExerciseInstancesService,
  ) {}

  /**
   * POST /exercise-instances
   * Crea una nueva instancia de ejercicio en un proof point.
   *
   * Body: CreateExerciseInstanceDto
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  // @Roles('instructor', 'admin')
  async createInstance(@Body() dto: CreateExerciseInstanceDto) {
    const instance = await this.instancesService.createInstance(dto);

    return {
      success: true,
      data: instance,
      message: 'Instancia de ejercicio creada exitosamente',
    };
  }

  /**
   * GET /exercise-instances/proof-point/:proofPointId
   * Obtiene todas las instancias de ejercicios de un proof point específico.
   */
  @Get('proof-point/:proofPointId')
  async getInstancesByProofPoint(@Param('proofPointId') proofPointId: string) {
    const instances =
      await this.instancesService.getInstancesByProofPoint(proofPointId);

    return {
      success: true,
      data: instances,
      count: instances.length,
    };
  }

  /**
   * GET /exercise-instances/:id
   * Obtiene una instancia específica de ejercicio por su ID.
   */
  @Get(':id')
  async getInstanceById(@Param('id') id: string) {
    const instance = await this.instancesService.getInstanceById(id);

    return {
      success: true,
      data: instance,
    };
  }

  /**
   * GET /exercise-instances/:id/content
   * Obtiene el contenido generado de una instancia.
   */
  @Get(':id/content')
  async getInstanceContent(@Param('id') id: string) {
    const content = await this.instancesService.getInstanceContent(id);

    return {
      success: true,
      data: content,
    };
  }

  /**
   * PUT /exercise-instances/:id
   * Actualiza una instancia de ejercicio.
   *
   * Body: UpdateExerciseInstanceDto
   */
  @Put(':id')
  // @Roles('instructor', 'admin')
  async updateInstance(
    @Param('id') id: string,
    @Body() dto: UpdateExerciseInstanceDto,
  ) {
    const updated = await this.instancesService.updateInstance(id, dto);

    return {
      success: true,
      data: updated,
      message: 'Instancia de ejercicio actualizada exitosamente',
    };
  }

  /**
   * DELETE /exercise-instances/:id
   * Elimina una instancia de ejercicio.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  // @Roles('instructor', 'admin')
  async deleteInstance(@Param('id') id: string) {
    await this.instancesService.deleteInstance(id);
  }

  /**
   * POST /exercise-instances/proof-point/:proofPointId/reorder
   * Reordena las instancias de ejercicios de un proof point.
   *
   * Body: { ordenamiento: Array<{ instanceId: string, orden: number }> }
   */
  @Post('proof-point/:proofPointId/reorder')
  @HttpCode(HttpStatus.OK)
  // @Roles('instructor', 'admin')
  async reorderInstances(
    @Param('proofPointId') proofPointId: string,
    @Body('ordenamiento') ordenamiento: Array<{ instanceId: string; orden: number }>,
  ) {
    await this.instancesService.reorderInstances(proofPointId, ordenamiento);

    return {
      success: true,
      message: 'Ejercicios reordenados exitosamente',
    };
  }

  /**
   * POST /exercise-instances/:id/duplicate
   * Duplica una instancia de ejercicio.
   */
  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  // @Roles('instructor', 'admin')
  async duplicateInstance(@Param('id') id: string) {
    const duplicated = await this.instancesService.duplicateInstance(id);

    return {
      success: true,
      data: duplicated,
      message: 'Instancia de ejercicio duplicada exitosamente',
    };
  }
}
