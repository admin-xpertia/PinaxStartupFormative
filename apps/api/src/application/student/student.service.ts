import { Injectable, Logger } from "@nestjs/common";
import { SurrealDbService } from "../../core/database/surrealdb.service";

export interface CreateStudentParams {
  email: string;
  nombre: string;
  password: string;
  metadata?: Record<string, any>;
  pais?: string;
  ciudad?: string;
  nivelEducativo?: string;
  intereses?: string[];
  biografia?: string;
  avatarUrl?: string;
}

export interface StudentRecord {
  id: string;
  user: string;
  metadata?: Record<string, any>;
  pais?: string | null;
  ciudad?: string | null;
  nivel_educativo?: string | null;
  intereses?: string[];
  biografia?: string | null;
  avatar_url?: string | null;
}

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(private readonly db: SurrealDbService) {}

  async findByUserId(userId: string): Promise<StudentRecord | null> {
    const result = await this.db.query<any>(
      `
        SELECT * FROM estudiante
        WHERE user = type::thing($userId)
        LIMIT 1
      `,
      { userId },
    );

    return this.extractSingle<StudentRecord>(result);
  }

  async ensureProfileForUser(user: { id: string; nombre?: string }): Promise<StudentRecord> {
    const existing = await this.findByUserId(user.id);
    if (existing) {
      return existing;
    }

    const created = await this.createStudentProfile(user.id, {
      nombre: user.nombre || "Estudiante",
    });

    return created;
  }

  async createStudentAccount(params: CreateStudentParams): Promise<{
    userId: string;
    student: StudentRecord;
  }> {
    const existing = await this.findUserByEmail(params.email);
    if (existing) {
      throw new Error("El email ya está registrado");
    }

    const creationResult = await this.db.query<any>(
      `
        LET $user = (
          CREATE user SET
            email = string::lowercase($email),
            nombre = $nombre,
            password_hash = crypto::argon2::generate($password),
            rol = 'estudiante',
            activo = true,
            preferencias = {},
            created_at = time::now(),
            updated_at = time::now()
        );

        LET $student = (
          CREATE estudiante SET
            user = $user.id,
            metadata = $metadata ?? {},
            pais = $pais,
            ciudad = $ciudad,
            nivel_educativo = $nivelEducativo,
            intereses = $intereses ?? [],
            biografia = $biografia,
            avatar_url = $avatarUrl,
            created_at = time::now(),
            updated_at = time::now()
        );

        RETURN { user: $user, student: $student };
      `,
      {
        email: params.email,
        nombre: params.nombre,
        password: params.password,
        metadata: {
          nombre: params.nombre,
          ...(params.metadata ?? {}),
        },
        pais: params.pais,
        ciudad: params.ciudad,
        nivelEducativo: params.nivelEducativo,
        intereses: params.intereses ?? [],
        biografia: params.biografia,
        avatarUrl: params.avatarUrl,
      },
    );

    const payload = this.extractSingle<{
      user: { id: string };
      student: StudentRecord;
    }>(creationResult);

    if (!payload?.user?.id || !payload?.student?.id) {
      this.logger.error("No se pudo crear el estudiante - resultado incompleto");
      throw new Error("No se pudo crear el estudiante");
    }

    return {
      userId: payload.user.id,
      student: payload.student,
    };
  }

  async createStudentProfile(
    userId: string,
    params?: {
      nombre?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<StudentRecord> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      return existing;
    }

    const result = await this.db.query<any>(
      `
        CREATE estudiante SET
          user = type::thing($userId),
          metadata = $metadata ?? {},
          created_at = time::now(),
          updated_at = time::now()
      `,
      {
        userId,
        metadata: {
          nombre: params?.nombre,
          ...(params?.metadata ?? {}),
        },
      },
    );

    const student = this.extractSingle<StudentRecord>(result);
    if (!student?.id) {
      throw new Error("No se pudo crear el perfil de estudiante");
    }

    return student;
  }

  private async findUserByEmail(email: string): Promise<any | null> {
    const result = await this.db.query<any>(
      `
        SELECT * FROM user
        WHERE string::lowercase(email) = string::lowercase($email)
        LIMIT 1
      `,
      { email },
    );

    return this.extractSingle(result);
  }

  private extractSingle<T>(result: any): T | null {
    if (!result) return null;

    if (Array.isArray(result)) {
      if (result.length === 0) return null;

      const first = result[0];
      if (Array.isArray(first)) {
        return (first[0] as T) ?? null;
      }
      return first as T;
    }

    return result as T;
  }
}
