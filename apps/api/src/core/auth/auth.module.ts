import { Module } from "@nestjs/common";
import { SurrealDbModule } from "../database";
import { AuthGuard } from "../guards/auth.guard";

@Module({
  imports: [SurrealDbModule],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthCoreModule {}
