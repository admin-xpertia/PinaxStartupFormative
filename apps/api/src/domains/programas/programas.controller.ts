import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/core/guards/auth.guard";
import { ProgramOwnershipGuard } from "./guards/program-ownership.guard";
import { User } from "src/core/decorators";
import { ProgramasService } from "./programas.service";
import { CreateProgramDto, ArquitecturaResponseDto } from "./dto";
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
}
