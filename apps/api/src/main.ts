import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create(AppModule);

  // Global prefix
  const apiPrefix = process.env.API_PREFIX || "api/v1";
  app.setGlobalPrefix(apiPrefix);

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Xpertia Classroom API")
    .setDescription(
      "AI-powered classroom management API - Domain-Driven Design Architecture",
    )
    .setVersion("1.0")
    .addTag("programs", "Program Design - Educational Programs Management")
    .addTag("fases", "Program Fases/Phases Management")
    .addTag("proof-points", "Proof Points Management")
    .addTag("exercise-templates", "Exercise Catalog - Template Management")
    .addTag("exercise-instances", "Exercise Instance - Exercise Assignments")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Token JWT generado por SurrealDB",
        in: "header",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  // Start server
  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 API corriendo en: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Documentación disponible en: http://localhost:${port}/docs`);
}

bootstrap();
