import { Test } from "@nestjs/testing";

import { AppController } from "../src/app.controller";
import { AppModule } from "../src/app.module";

describe("AppController", () => {
  let controller: AppController;

  beforeEach(async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    controller = moduleFixture.get(AppController);
  });

  it("returns health status", () => {
    expect(controller.health()).toMatchObject({
      ok: true,
      service: "ming-api"
    });
  });
});
