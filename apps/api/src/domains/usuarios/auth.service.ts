import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { SurrealDbService } from '../../core/database';
import { SignupDto, SigninDto, AuthResponseDto } from './dto';

/**
 * Servicio de autenticación
 *
 * Gestiona el registro e inicio de sesión de instructores
 * usando los SCOPEs de SurrealDB
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly INSTRUCTOR_SCOPE = 'instructor_scope';

  constructor(private readonly surrealDb: SurrealDbService) {}

  /**
   * Registra un nuevo instructor
   */
  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    try {
      this.logger.log(`Intentando registrar usuario: ${signupDto.email}`);

      // Ejecutar SIGNUP en SurrealDB con el instructor_scope
      const token = await this.surrealDb.signup(this.INSTRUCTOR_SCOPE, {
        email: signupDto.email,
        nombre: signupDto.nombre,
        password: signupDto.password,
      });

      this.logger.log(`Usuario registrado exitosamente: ${signupDto.email}`);

      // Obtener información del usuario creado
      const user = await this.getUserFromToken(token);

      // Retornar respuesta con token
      return new AuthResponseDto(token, user);
    } catch (error) {
      this.handleAuthError(error, 'signup');
    }
  }

  /**
   * Inicia sesión de un instructor
   */
  async signin(signinDto: SigninDto): Promise<AuthResponseDto> {
    try {
      this.logger.log(`Intentando iniciar sesión: ${signinDto.email}`);

      // Ejecutar SIGNIN en SurrealDB con el instructor_scope
      const token = await this.surrealDb.authenticate(this.INSTRUCTOR_SCOPE, {
        email: signinDto.email,
        password: signinDto.password,
      });

      this.logger.log(`Sesión iniciada exitosamente: ${signinDto.email}`);

      // Obtener información del usuario
      const user = await this.getUserFromToken(token);

      // Retornar respuesta con token
      return new AuthResponseDto(token, user);
    } catch (error) {
      this.handleAuthError(error, 'signin');
    }
  }

  /**
   * Obtiene información del usuario desde el token
   */
  private async getUserFromToken(token: string): Promise<any> {
    try {
      // Autenticarse con el token para obtener datos del usuario
      await this.surrealDb.authenticateWithToken(token);

      // Obtener información del usuario actual
      const [result] = await this.surrealDb.query<any>(
        'SELECT * FROM $auth',
      );

      if (!result || !result.result) {
        throw new UnauthorizedException('No se pudo obtener información del usuario');
      }

      return result.result;
    } catch (error) {
      this.logger.error('Error al obtener información del usuario', error);
      throw new UnauthorizedException('Token inválido');
    }
  }

  /**
   * Maneja errores de autenticación
   */
  private handleAuthError(error: any, operation: string): never {
    this.logger.error(`Error en ${operation}:`, error);

    // Extraer mensaje de error de SurrealDB
    const errorMessage = error?.message || error?.toString() || '';

    // Usuario ya existe (en signup)
    if (
      errorMessage.includes('already exists') ||
      errorMessage.includes('duplicate') ||
      errorMessage.includes('unique')
    ) {
      throw new ConflictException('El email ya está registrado');
    }

    // Credenciales inválidas (en signin)
    if (
      errorMessage.includes('No record') ||
      errorMessage.includes('invalid credentials') ||
      errorMessage.includes('authentication failed')
    ) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    // Usuario inactivo
    if (errorMessage.includes('activo')) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Error genérico
    throw new InternalServerErrorException(
      'Error en el proceso de autenticación',
    );
  }

  /**
   * Valida un token JWT
   */
  async validateToken(token: string): Promise<any> {
    try {
      await this.surrealDb.authenticateWithToken(token);
      const user = await this.getUserFromToken(token);
      return user;
    } catch (error) {
      this.logger.error('Error al validar token', error);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /**
   * Cierra sesión (invalida token)
   */
  async signout(): Promise<void> {
    try {
      await this.surrealDb.invalidate();
      this.logger.log('Sesión cerrada exitosamente');
    } catch (error) {
      this.logger.error('Error al cerrar sesión', error);
      throw new InternalServerErrorException('Error al cerrar sesión');
    }
  }
}
