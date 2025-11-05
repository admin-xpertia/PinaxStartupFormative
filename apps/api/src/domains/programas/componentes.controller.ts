import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ComponentesService } from './componentes.service';
import { UpdateContenidoDto } from './dto/update-contenido.dto';
import { CrearRubricaDto } from '../contenido/dto';

/**
 * Controlador para la gestión de componentes (lecciones, cuadernos, simulaciones, herramientas).
 *
 * Este controlador maneja:
 * - Edición de contenido con versionamiento automático
 * - Gestión de rúbricas asociadas a componentes
 *
 * Endpoints según especificación de Fase 4:
 * - GET /componentes/:id/contenido - Carga datos para el editor
 * - PUT /componentes/:id/contenido - Guarda datos con versionamiento
 * - GET /componentes/:componenteId/rubrica - Obtiene rúbrica
 * - POST /componentes/:componenteId/rubrica - Crea rúbrica
 * - PUT /rubricas/:rubricaId - Actualiza rúbrica
 */
@Controller('componentes')
// @UseGuards(JwtAuthGuard, ProgramOwnershipGuard) // TODO: Descomentar cuando se implemente
export class ComponentesController {
  constructor(private readonly componentesService: ComponentesService) {}

  /**
   * Endpoint para cargar datos en el editor.
   *
   * Devuelve el contenido actual del componente para que los editores
   * (lesson-editor, notebook-editor, etc.) lo muestren.
   *
   * @param id - ID del componente
   * @returns El contenido actual del componente
   */
  @Get(':id/contenido')
  async getContenido(@Param('id') id: string) {
    return this.componentesService.getContenidoActual(id);
  }

  /**
   * Endpoint para guardar datos del editor con versionamiento.
   *
   * LÓGICA DE VERSIONAMIENTO:
   * 1. Obtiene el contenido actual del componente
   * 2. Crea un snapshot en la tabla 'version_contenido'
   * 3. Actualiza el contenido con los nuevos datos
   * 4. Marca el contenido como 'draft' para revisión
   *
   * Todo esto ocurre en una transacción de SurrealDB.
   *
   * @param id - ID del componente
   * @param updateContenidoDto - Nuevo contenido a guardar
   * @param req - Request con información del usuario autenticado
   * @returns El contenido actualizado
   */
  @Put(':id/contenido')
  async updateContenido(
    @Param('id') id: string,
    @Body() updateContenidoDto: UpdateContenidoDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'user:system'; // TODO: Obtener del JWT real
    return this.componentesService.updateContenidoConVersionamiento(
      id,
      updateContenidoDto.contenido,
      userId,
    );
  }

  /**
   * Obtiene la rúbrica de un componente.
   *
   * @param componenteId - ID del componente
   * @returns La rúbrica asociada al componente
   */
  @Get(':componenteId/rubrica')
  async getRubrica(@Param('componenteId') componenteId: string) {
    return this.componentesService.getRubrica(componenteId);
  }

  /**
   * Crea una nueva rúbrica para un componente.
   *
   * VALIDACIÓN AUTOMÁTICA:
   * - La suma de los pesos de las dimensiones debe ser 100
   * - Cada descriptor debe tener puntos entre 0 y 100
   *
   * @param componenteId - ID del componente
   * @param dto - Datos de la rúbrica
   * @returns La rúbrica creada
   */
  @Post(':componenteId/rubrica')
  async createRubrica(
    @Param('componenteId') componenteId: string,
    @Body() dto: CrearRubricaDto,
  ) {
    // Asegurarse de que el componenteId del parámetro coincida con el del body
    return this.componentesService.createRubrica({
      ...dto,
      componenteId,
    });
  }
}
