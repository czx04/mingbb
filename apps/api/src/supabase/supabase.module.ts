import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";

import { SUPABASE_ADMIN, SUPABASE_PUBLIC } from "./supabase.constants";

@Module({
  providers: [
    {
      provide: SUPABASE_ADMIN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createClient(
          configService.getOrThrow<string>("SUPABASE_URL"),
          configService.getOrThrow<string>("SUPABASE_SERVICE_ROLE_KEY"),
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
    },
    {
      provide: SUPABASE_PUBLIC,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createClient(
          configService.getOrThrow<string>("SUPABASE_URL"),
          configService.getOrThrow<string>("SUPABASE_ANON_KEY")
        )
    }
  ],
  exports: [SUPABASE_ADMIN, SUPABASE_PUBLIC]
})
export class SupabaseModule {}
