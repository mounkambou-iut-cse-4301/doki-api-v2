

// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permet à Nest d'écouter SIGINT/SIGTERM et d'appeler onModuleDestroy()
  app.enableShutdownHooks();

  /**
   * ✅ CORS ULTRA-PERMISSIF
   * - Accepte n'importe quel Origin (http/https, localhost, IP, domaine…)
   * - Compatible avec credentials (cookies/Authorization)
   * - Gère automatiquement les preflight OPTIONS
   */
  app.enableCors({
    origin: (origin, callback) => {
      // origin peut être undefined (ex: curl, requêtes serveur->serveur)
      // On autorise tout.
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],

    // IMPORTANT:
    // Ne mets pas allowedHeaders: ['*'] (pas fiable).
    // En le laissant undefined, le middleware CORS reflète automatiquement
    // les headers demandés par le navigateur (Access-Control-Request-Headers).
    // allowedHeaders: undefined,

    exposedHeaders: ['Content-Disposition'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // --- Swagger ---
  const config = new DocumentBuilder()
    .setTitle('DOKITA API')
    .setDescription('API de gestion de DOKITA')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // --- Body parser (si tu veux augmenter la limite) ---
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Démarrage serveur
  await app.listen(Number(process.env.PORT) || 3007, '0.0.0.0');
}
bootstrap();
