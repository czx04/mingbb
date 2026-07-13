import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>("FRONTEND_URL", "http://localhost:3000");
  const adminUrl = configService.get<string>("ADMIN_URL", "http://localhost:3001");
  const port = configService.get<number>("PORT", 4000);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: [frontendUrl, adminUrl],
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );

  await app.listen(port);
}

void bootstrap();
