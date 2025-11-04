import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * Módulo de Usuarios
 *
 * Gestiona la autenticación y gestión de usuarios
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class UsuariosModule {}
