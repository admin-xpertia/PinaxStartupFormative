import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SurrealDbService } from "../../core/database/surrealdb.service";
import {
  AuthResponseDto,
  AuthUserDto,
  SigninDto,
  SignupDto,
} from "../../presentation/dtos/auth";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly instructorScope: string;
  private readonly studentScope: string | null;
  private readonly enableStudentScope: boolean;

  constructor(
    private readonly surrealDb: SurrealDbService,
    private readonly configService: ConfigService,
  ) {
    this.instructorScope =
      this.configService.get<string>("AUTH_INSTRUCTOR_SCOPE") ||
      this.configService.get<string>("AUTH_SCOPE") ||
      "instructor_scope";

    this.studentScope =
      this.configService.get<string>("AUTH_STUDENT_SCOPE") || "user_scope";

    const studentScopeFlag = this.configService.get<string>(
      "AUTH_ENABLE_STUDENT_SCOPE",
    );
    this.enableStudentScope =
      studentScopeFlag === undefined ? true : studentScopeFlag !== "false";
  }

  /**
   * Registers a new instructor via SurrealDB scope
   */
  async signup(dto: SignupDto): Promise<AuthResponseDto> {
    const email = dto.email;

    try {
      const token = await this.surrealDb.signup(this.instructorScope, {
        email,
        nombre: dto.nombre,
        password: dto.password,
      });

      const user = await this.findUserByEmail(email);

      if (!user) {
        this.logger.error(
          `Usuario recién creado no se pudo recuperar (email: ${email})`,
        );
        throw new InternalServerErrorException(
          "No se pudo obtener la información del usuario",
        );
      }

      return this.buildAuthResponse(token, user);
    } catch (error: any) {
      this.logger.error("Error durante el signup", error);

      if (this.isConflictError(error)) {
        throw new ConflictException("El email ya está registrado");
      }

      throw new BadRequestException(
        error?.message || "No se pudo completar el registro",
      );
    }
  }

  /**
   * Authenticates a user and returns a JWT token + profile
   */
  async signin(dto: SigninDto): Promise<AuthResponseDto> {
    const email = dto.email;
    const credentials = {
      email,
      password: dto.password,
    };

    const scopesToTry = [this.instructorScope];
    if (
      this.enableStudentScope &&
      this.studentScope &&
      this.studentScope !== this.instructorScope
    ) {
      scopesToTry.push(this.studentScope);
    }

    let token: string | null = null;
    let lastError: any;

    for (const scope of scopesToTry) {
      try {
        token = await this.surrealDb.authenticate(scope, credentials);
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!token) {
      this.logger.warn(
        `Autenticación fallida para ${email}: ${lastError?.message || "unknown error"}`,
      );
      throw new UnauthorizedException(
        "Credenciales incorrectas o usuario inactivo",
      );
    }

    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Usuario no encontrado");
    }

    if (user.activo === false) {
      throw new UnauthorizedException("Usuario inactivo");
    }

    return this.buildAuthResponse(token, user);
  }

  /**
   * Maps raw Surreal user record into DTO
   */
  mapUser(user: any): AuthUserDto {
    if (!user) {
      throw new UnauthorizedException("Usuario no disponible en el contexto");
    }

    const id = user.id || user.ID || user?.["id"];

    return {
      id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      activo: user.activo,
      preferencias: user.preferencias || {},
    };
  }

  /**
   * Builds the AuthResponse payload
   */
  private buildAuthResponse(token: string, user: any): AuthResponseDto {
    const payload = this.decodeTokenPayload(token);

    return {
      token,
      tokenType: "Bearer",
      expiresIn: this.calculateExpiresIn(payload),
      user: this.mapUser(user),
    };
  }

  /**
   * Finds a user by email (case-insensitive)
   */
  private async findUserByEmail(email: string): Promise<any | null> {
    const query = `
      SELECT * FROM user
      WHERE string::lowercase(email) = string::lowercase($email)
      LIMIT 1
    `;

    const result = await this.surrealDb.query(query, { email });
    return this.extractSingleRecord(result);
  }

  /**
   * Extracts a single record from Surreal query result structure
   */
  private extractSingleRecord<T>(result: any): T | null {
    if (!result) {
      return null;
    }

    if (Array.isArray(result)) {
      if (result.length === 0) {
        return null;
      }

      const first = result[0];

      if (Array.isArray(first)) {
        return first.length > 0 ? (first[0] as T) : null;
      }

      return (first as T) ?? null;
    }

    return result as T;
  }

  /**
   * Detects duplicate key errors from SurrealDB
   */
  private isConflictError(error: any): boolean {
    const message = (error?.message || error?.toString() || "").toLowerCase();
    return (
      message.includes("already exists") ||
      message.includes("duplicate") ||
      message.includes("unique")
    );
  }

  /**
   * Decodes a SurrealDB JWT payload without verifying the signature
   */
  private decodeTokenPayload(token: string): Record<string, any> {
    const [, payloadSegment] = token.split(".");
    if (!payloadSegment) {
      return {};
    }

    try {
      const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
      const padded =
        normalized + "=".repeat((4 - (normalized.length % 4)) % 4 || 0);
      const json = Buffer.from(padded, "base64").toString("utf8");
      return JSON.parse(json);
    } catch (error) {
      this.logger.warn("No se pudo decodificar el token JWT", error as Error);
      return {};
    }
  }

  /**
   * Calculates token TTL in seconds based on JWT payload claims
   */
  private calculateExpiresIn(payload: Record<string, any>): number {
    if (!payload) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);

    if (payload.exp) {
      return Math.max(payload.exp - now, 0);
    }

    if (payload.iat && payload.ttl) {
      return Math.max(payload.ttl - (now - payload.iat), 0);
    }

    return 0;
  }
}
