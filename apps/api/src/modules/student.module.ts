import { Module } from "@nestjs/common";
import { SurrealDbModule } from "../core/database";
import { StudentService } from "../application/student/student.service";
import { StudentController } from "../presentation/controllers/student/student.controller";
import { CohortModule } from "./cohort.module";

@Module({
  imports: [SurrealDbModule, CohortModule],
  providers: [StudentService],
  controllers: [StudentController],
  exports: [StudentService],
})
export class StudentModule {}
