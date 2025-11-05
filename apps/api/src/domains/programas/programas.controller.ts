import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "src/core/guards/auth.guard";
import { ProgramOwnershipGuard } from "./guards/program-ownership.guard";
import { User } from "src/core/decorators";
import { ProgramasService } from "./programas.service";
import {
  CreateProgramDto,
  ArquitecturaResponseDto,
  UpdateFaseDocDto,
} from "./dto";
import { ProgramVersionDto } from "./dto/program-version.dto";
import { ProgramaCreado } from "./types";

/**
 * Controlador para gestionar programas educativos
 *
 * IMPORTANTE: Todos los endpoints están protegidos por AuthGuard.
 * Los endpoints que acceden a recursos específicos también están protegidos
 * por ProgramOwnershipGuard para verificar que el usuario sea el propietario.
 */
@Controller("programas")
@UseGuards(AuthGuard)
export class ProgramasController {
  constructor(private readonly programasService: ProgramasService) {}

  /**
   * Crea un programa completo desde el wizard.
   * Este endpoint ejecuta una transacción que crea:
   * - El programa
   * - Todas sus fases
   * - Todos los proof points de cada fase
   * - Todos los niveles de cada proof point
   * - Componentes placeholder para cada nivel
   *
   * @param createProgramDto - Datos del programa desde el wizard
   * @param userId - ID del usuario autenticado (extraído del token JWT)
   * @returns El programa creado con su ID
   */
  @Post()
  async create(
    @Body() createProgramDto: CreateProgramDto,
    @User("id") userId: string,
  ): Promise<ProgramaCreado> {
    return this.programasService.createFromWizard(createProgramDto, userId);
  }

  /**
   * Obtiene todos los programas creados por el usuario autenticado
   *
   * @param userId - ID del usuario autenticado
   * @returns Lista de programas del usuario
   */
  @Get()
  async findAll(@User("id") userId: string) {
    return this.programasService.findAllByCreator(userId);
  }

  /**
   * Obtiene las versiones disponibles de un programa.
   *
   * MVP: Por ahora solo devolvemos la versión actual (1.0)
   * Futuro: Sistema completo de versionamiento con historial
   *
   * @param id - ID del programa
   * @returns Lista de versiones del programa
   */
  @Get(":id/versiones")
  @UseGuards(ProgramOwnershipGuard)
  async getVersiones(@Param("id") id: string): Promise<ProgramVersionDto[]> {
    return this.programasService.getVersiones(id);
  }

  /**
   * Obtiene la arquitectura completa de un programa específico.
   * Retorna toda la jerarquía anidada:
   * Programa -> Fases -> ProofPoints -> Niveles -> Componentes
   *
   * Este endpoint es utilizado por el frontend para renderizar el roadmap visual
   * (visual-roadmap-builder.tsx)
   *
   * PROTEGIDO: Solo el creador del programa puede acceder a su arquitectura
   *
   * @param id - ID del programa (sin el prefijo "programa:")
   * @returns Arquitectura completa del programa con toda su jerarquía
   */
  @Get(":id/arquitectura")
  @UseGuards(ProgramOwnershipGuard)
  async getArquitectura(
    @Param("id") id: string,
  ): Promise<ArquitecturaResponseDto> {
    return this.programasService.getProgramaConArquitectura(id);
  }

  /**
   * Obtiene la documentación asociada a una fase específica.
   *
   * Protegido por ProgramOwnershipGuard para asegurar que solo el creador
   * del programa padre pueda acceder a la documentación.
   */
  @Get("fases/:faseId/documentacion")
  @UseGuards(ProgramOwnershipGuard)
  async getFaseDocumentacion(@Param("faseId") faseId: string) {
    return this.programasService.getDocumentacion(faseId);
  }

  /**
   * Actualiza (o crea, si no existe) la documentación de una fase.
   *
   * Protegido por ProgramOwnershipGuard para asegurar que solo el creador
   * del programa padre pueda editar la documentación.
   */
  @Put("fases/:faseId/documentacion")
  @UseGuards(ProgramOwnershipGuard)
  async updateFaseDocumentacion(
    @Param("faseId") faseId: string,
    @Body() data: UpdateFaseDocDto,
  ) {
    return this.programasService.updateDocumentacion(faseId, data);
  }
}
