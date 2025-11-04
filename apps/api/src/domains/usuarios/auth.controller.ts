import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public, User } from '../../core/decorators';
import { AuthService } from './auth.service';
import { SignupDto, SigninDto, AuthResponseDto } from './dto';

/**
 * Controlador de autenticación
 *
 * Endpoints para registro e inicio de sesión de instructores
 */
@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/signup
   * Registra un nuevo instructor
   */
  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo instructor',
    description:
      'Crea una nueva cuenta de instructor y retorna un token JWT',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Instructor registrado exitosamente',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos',
  })
  @ApiConflictResponse({
    description: 'El email ya está registrado',
  })
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponseDto> {
    this.logger.log(`POST /auth/signup - Email: ${signupDto.email}`);
    return await this.authService.signup(signupDto);
  }

  /**
   * POST /auth/signin
   * Inicia sesión de un instructor
   */
  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica un instructor y retorna un token JWT',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sesión iniciada exitosamente',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales incorrectas o usuario inactivo',
  })
  async signin(@Body() signinDto: SigninDto): Promise<AuthResponseDto> {
    this.logger.log(`POST /auth/signin - Email: ${signinDto.email}`);
    return await this.authService.signin(signinDto);
  }

  /**
   * GET /auth/me
   * Obtiene información del usuario autenticado
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener usuario actual',
    description: 'Retorna la información del usuario autenticado usando el token JWT',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuario obtenido exitosamente',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido o no proporcionado',
  })
  async getMe(@User() user: any) {
    this.logger.log(`GET /auth/me - User ID: ${user.id}`);
    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      preferencias: user.preferencias,
      activo: user.activo,
    };
  }

  /**
   * POST /auth/signout
   * Cierra sesión (invalida token)
   */
  @Post('signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Invalida el token JWT actual',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Sesión cerrada exitosamente',
  })
  async signout(): Promise<void> {
    this.logger.log('POST /auth/signout');
    return await this.authService.signout();
  }
}
