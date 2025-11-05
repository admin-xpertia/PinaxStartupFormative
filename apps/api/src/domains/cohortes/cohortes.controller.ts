import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { CohortesService } from "./cohortes.service";
import { CreateCohorteDto, InviteEstudiantesDto } from "./dto";
import { CommunicationDto } from "./dto/communication.dto";
import { AuthGuard } from "src/core/guards/auth.guard";
import { User } from "src/core/decorators";

@Controller("api/v1/cohortes")
@UseGuards(AuthGuard)
export class CohortesController {
  constructor(private readonly cohortesService: CohortesService) {}

  /**
   * POST /api/v1/cohortes
   * Crea una nueva cohorte con snapshot del programa
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCohorte(
    @Body() dto: CreateCohorteDto,
    @User("id") userId: string,
  ) {
    return this.cohortesService.createCohorteConSnapshot(dto, userId);
  }

  /**
   * GET /api/v1/cohortes
   * Lista todas las cohortes del instructor autenticado
   */
  @Get()
  async findAll(@User("id") userId: string) {
    return this.cohortesService.findAllByInstructor(userId);
  }

  /**
   * GET /api/v1/cohortes/:id
   * Obtiene una cohorte específica por ID
   */
  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @User("id") userId: string,
  ) {
    return this.cohortesService.findCohorteById(id, userId);
  }

  /**
   * GET /api/v1/cohortes/:id/estudiantes
   * Lista todos los estudiantes inscritos en una cohorte
   */
  @Get(":id/estudiantes")
  async findEstudiantes(@Param("id") id: string) {
    return this.cohortesService.findEstudiantesByCohorte(id);
  }

  /**
   * POST /api/v1/cohortes/:id/invitar
   * Invita estudiantes a una cohorte
   */
  @Post(":id/invitar")
  @HttpCode(HttpStatus.OK)
  async invitarEstudiantes(
    @Param("id") id: string,
    @Body() dto: InviteEstudiantesDto,
    @User("id") userId: string,
  ) {
    return this.cohortesService.invitarEstudiantes(id, dto, userId);
  }

  /**
   * GET /api/v1/cohortes/:id/comunicaciones
   * Obtiene el historial de comunicaciones de una cohorte
   */
  @Get(":id/comunicaciones")
  async getComunicaciones(
    @Param("id") id: string,
    @User("id") userId: string,
  ): Promise<CommunicationDto[]> {
    return this.cohortesService.getComunicaciones(id, userId);
  }
}
