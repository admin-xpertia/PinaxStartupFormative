import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { CreateCohortUseCase } from "../../../application/cohort/use-cases/CreateCohort/CreateCohortUseCase";
import { EnrollStudentUseCase } from "../../../application/cohort/use-cases/EnrollStudent/EnrollStudentUseCase";
import { ListCohortsQuery } from "../../../application/cohort/queries/ListCohorts/ListCohortsQuery";
import { GetCohortDetailsQuery } from "../../../application/cohort/queries/GetCohortDetails/GetCohortDetailsQuery";
import { User } from "../../../core/decorators";
import {
  CreateCohortRequestDto,
  EnrollStudentRequestDto,
  CohortResponseDto,
} from "../../dtos/cohort";
import type { CohortListItem } from "../../../application/cohort/queries/ListCohorts/ListCohortsQuery";
import type { CohortDetailsResult } from "../../../application/cohort/queries/GetCohortDetails/GetCohortDetailsQuery";

@ApiTags("cohortes")
@ApiBearerAuth("JWT-auth")
@Controller("cohortes")
export class CohortController {
  constructor(
    private readonly createCohortUseCase: CreateCohortUseCase,
    private readonly enrollStudentUseCase: EnrollStudentUseCase,
    private readonly listCohortsQuery: ListCohortsQuery,
    private readonly getCohortDetailsQuery: GetCohortDetailsQuery,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Listar cohortes",
    description: "Obtiene todas las cohortes creadas por el instructor",
  })
  @ApiResponse({
    status: 200,
    type: [CohortResponseDto],
  })
  async listCohorts(): Promise<CohortResponseDto[]> {
    const result = await this.listCohortsQuery.execute();

    return result.match({
      ok: (items) => items.map((item) => this.mapToDto(item)),
      fail: (error) => {
        throw new BadRequestException(error.message);
      },
    });
  }

  @Get(":id")
  @ApiOperation({
    summary: "Detalle de una cohorte",
    description:
      "Obtiene la información completa de una cohorte, incluyendo su snapshot",
  })
  @ApiParam({
    name: "id",
    description: "ID de la cohorte",
    example: "cohorte:primavera_2025",
  })
  @ApiResponse({
    status: 200,
    type: CohortResponseDto,
  })
  async getCohort(@Param("id") id: string): Promise<CohortResponseDto> {
    const result = await this.getCohortDetailsQuery.execute({ cohorteId: id });

    return result.match({
      ok: (details) => this.mapToDto(details),
      fail: (error) => {
        if (error.message.includes("no encontrada")) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      },
    });
  }

  @Post()
  @ApiOperation({
    summary: "Crear nueva cohorte",
    description: "Crea una cohorte a partir de un programa publicado",
  })
  @ApiResponse({
    status: 201,
    description: "Cohorte creada exitosamente",
    type: CohortResponseDto,
  })
  async createCohort(
    @Body() body: CreateCohortRequestDto,
    @User() requester: any,
  ): Promise<CohortResponseDto> {
    const instructorId = body.instructorId ?? requester?.id;
    if (!instructorId) {
      throw new BadRequestException(
        "No se pudo determinar el instructor autenticado",
      );
    }

    const creationResult = await this.createCohortUseCase.execute({
      ...body,
      instructorId,
    });
    if (creationResult.isFail()) {
      throw new BadRequestException(creationResult.getError().message);
    }

    const { cohorteId } = creationResult.getValue();
    const detailsResult = await this.getCohortDetailsQuery.execute({
      cohorteId,
    });

    return detailsResult.match({
      ok: (data) => this.mapToDto(data),
      fail: (error) => {
        throw new BadRequestException(error.message);
      },
    });
  }

  @Post(":cohorteId/estudiantes")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Inscribir estudiante en cohorte",
    description: "Relaciona un estudiante existente con una cohorte",
  })
  @ApiResponse({
    status: 201,
    description: "Estudiante inscrito exitosamente",
  })
  async enrollStudent(
    @Param("cohorteId") cohorteId: string,
    @Body() body: EnrollStudentRequestDto,
  ): Promise<{ inscripcionId: string; estado: string }> {
    const result = await this.enrollStudentUseCase.execute({
      cohorteId,
      estudianteId: body.estudianteId,
      estado: body.estado,
    });

    return result.match({
      ok: (response) => response,
      fail: (error) => {
        if (error.message.includes("ya está inscrito")) {
          throw new BadRequestException(error.message);
        }
        if (error.message.includes("no existe")) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      },
    });
  }

  private mapToDto(
    source: CohortListItem | CohortDetailsResult,
  ): CohortResponseDto {
    const cohorte = source.cohorte;
    const programa = source.programa;

    return {
      id: cohorte.getId().toString(),
      nombre: cohorte.getNombre(),
      descripcion: cohorte.getDescripcion(),
      estado: cohorte.getEstado().getValue(),
      fechaInicio: cohorte.getFechaInicio().toISOString(),
      fechaFinEstimada: cohorte.getFechaFinEstimada()
        ? cohorte.getFechaFinEstimada()!.toISOString()
        : undefined,
      programa: {
        id: programa?.getId().toString() ?? cohorte.getPrograma().toString(),
        nombre: programa?.getNombre() ?? "",
        version: programa?.getVersionActual().toString() ?? "",
      },
      configuracion: cohorte.getConfiguracion(),
      snapshotProgramaId: cohorte.getSnapshotPrograma()
        ? cohorte.getSnapshotPrograma()!.toString()
        : undefined,
      totalEstudiantes:
        "totalEstudiantes" in source ? source.totalEstudiantes : 0,
      structure:
        "structure" in source ? (source.structure ?? undefined) : undefined,
    };
  }
}
