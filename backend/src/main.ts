import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Extremely permissive CORS for debugging and production stability
  app.enableCors({
    origin: (origin, callback) => {
      // Allow all origins in development and production for now to fix the blocking issue
      callback(null, true);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Credentials',
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Serve uploaded assets
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('HB Market API')
    .setDescription('Backend API for HB Market')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  // Railway injects a dynamic PORT environment variable.
  // It is crucial to listen on this port and bind to 0.0.0.0
  const port = process.env.PORT || 3000;
  console.log(`Starting server on port ${port}...`);
  console.log(`Database connection attempt using configured DATABASE_URL...`);
  
  // Seed initial admin user if not exists
  try {
    const { AdminUsersService } = await import('./admin-users/admin-users.service');
    const adminUsersService = app.get(AdminUsersService);
    const existing = await adminUsersService.findAll();
    if (existing.length === 0) {
      console.log('Seed: Creating default admin user...');
      const { hash } = await import('bcryptjs');
      const passwordHash = await hash('12345678', 10);
      await adminUsersService.create({
        email: 'admin@hb.com',
        password_hash: passwordHash,
        name: 'Admin',
      });
      console.log('Seed: Default admin user created (admin@hb.com / 12345678)');
    }
  } catch (seedError) {
    console.warn('Seed: Could not create default admin user:', seedError.message);
  }

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server is live at http://0.0.0.0:${port}`);
}
bootstrap().catch(err => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
