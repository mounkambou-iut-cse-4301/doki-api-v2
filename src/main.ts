import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe())
    // 1. Définition du document OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Doki API')                    // Titre de votre API
    .setDescription('API pour Doki-App')     // Description
    .setVersion('1.0')                       // Version
    // .addBearerAuth()                       // (optionnel) si vous utilisez JWT Bearer
    .build();

  // 2. Création du document Swagger
  const document = SwaggerModule.createDocument(app, config);

  // 3. Montage de l’UI Swagger à l’URL /api-docs
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
