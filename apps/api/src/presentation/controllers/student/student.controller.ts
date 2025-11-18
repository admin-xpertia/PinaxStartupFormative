import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  CreateStudentDto,
  StudentProfileResponseDto,
} from "../../dtos/student";
import { StudentService } from "../../../application/student/student.service";
import { EnrollStudentUseCase } from "../../../application/cohort/use-cases/EnrollStudent/EnrollStudentUseCase";
import { User } from "../../../core/decorators";

@ApiTags("students")
@ApiBearerAuth("JWT-auth")
@Controller("students")
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly enrollStudentUseCase: EnrollStudentUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Crear estudiante con credenciales",
    description:
      "Permite a instructores/administradores crear un usuario con rol estudiante y opcionalmente inscribirlo en una cohorte",
  })
  @ApiResponse({
    status: 201,
    description: "Estudiante creado",
  })
  async createStudent(
    @Body() body: CreateStudentDto,
    @User() requester: any,
  ): Promise<{
    userId: string;
    studentId: string;
    email: string;
    nombre: string;
    cohortEnrollment?: { cohorteId: string; inscripcionId: string };
  }> {
    this.assertInstructorOrAdmin(requester);

    try {
      const { userId, student } =
        await this.studentService.createStudentAccount(body);

      let cohortEnrollment: { cohorteId: string; inscripcionId: string } | undefined;
      if (body.cohorteId) {
        const enrollmentResult = await this.enrollStudentUseCase.execute({
          cohorteId: body.cohorteId,
          estudianteId: student.id,
          estado: "activo",
        });

        enrollmentResult.match({
          ok: (value) => {
            cohortEnrollment = {
              cohorteId: body.cohorteId!,
              inscripcionId: value.inscripcionId,
            };
          },
          fail: (error) => {
            throw error;
          },
        });
      }

      return {
        userId,
        studentId: student.id,
        email: body.email.toLowerCase(),
        nombre: body.nombre,
        cohortEnrollment,
      };
    } catch (error: any) {
      throw new BadRequestException(error?.message || "No se pudo crear el estudiante");
    }
  }

  @Get("by-user/:userId")
  @ApiOperation({
    summary: "Obtener perfil de estudiante por userId",
  })
  @ApiResponse({
    status: 200,
    type: StudentProfileResponseDto,
  })
  async getByUser(
    @Param("userId") userId: string,
  ): Promise<StudentProfileResponseDto> {
    const student = await this.studentService.findByUserId(userId);
    if (!student) {
      throw new BadRequestException("No existe un perfil de estudiante para este usuario");
    }

    return {
      id: student.id,
      userId,
      nombre: student.metadata?.nombre || "",
      email: undefined,
      metadata: student.metadata,
    };
  }

  private assertInstructorOrAdmin(user: any) {
    if (!user || !["admin", "instructor"].includes(user.rol)) {
      throw new ForbiddenException(
        "Solo instructores o administradores pueden crear estudiantes",
      );
    }
  }
}
