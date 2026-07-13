import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>(
    "FRONTEND_URL",
    "http://localhost:3000",
  );
  const adminUrl = configService.get<string>(
    "ADMIN_URL",
    "http://localhost:3001",
  );
  const port = configService.get<number>("PORT", 4000);
  const trustProxyHops = Number(
    configService.get<string>("TRUST_PROXY_HOPS", "0"),
  );

  app.set("trust proxy", trustProxyHops);
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: [frontendUrl, adminUrl],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(port);
}

void bootstrap();
