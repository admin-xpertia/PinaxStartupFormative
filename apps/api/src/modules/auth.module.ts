import { Module } from "@nestjs/common";
import { SurrealDbModule } from "../core/database";
import { AuthService } from "../application/auth/auth.service";
import { AuthController } from "../presentation/controllers/auth/auth.controller";
import { StudentModule } from "./student.module";

@Module({
  imports: [SurrealDbModule, StudentModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
