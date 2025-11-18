import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthService } from "../../../application/auth/auth.service";
import {
  AuthResponseDto,
  AuthUserDto,
  SigninDto,
  SignupDto,
} from "../../dtos/auth";
import { Public, User } from "../../../core/decorators";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signup")
  @ApiOperation({ summary: "Registrar un nuevo instructor" })
  @ApiResponse({
    status: 201,
    description: "Instructor registrado correctamente",
    type: AuthResponseDto,
  })
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(signupDto);
  }

  @Public()
  @Post("signin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Iniciar sesión" })
  @ApiResponse({
    status: 200,
    description: "Credenciales válidas",
    type: AuthResponseDto,
  })
  async signin(@Body() signinDto: SigninDto): Promise<AuthResponseDto> {
    return this.authService.signin(signinDto);
  }

  @Get("me")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Obtener el usuario autenticado" })
  @ApiResponse({
    status: 200,
    description: "Usuario autenticado",
    type: AuthUserDto,
  })
  async getProfile(@User() user: any): Promise<AuthUserDto> {
    return this.authService.mapUser(user);
  }

  @Post("signout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Cerrar sesión" })
  @ApiResponse({
    status: 204,
    description: "Sesión cerrada",
  })
  async signout(): Promise<void> {
    // La invalidación del token se maneja en el cliente;
    // el backend responde 204 para mantener compatibilidad.
    return;
  }
}
