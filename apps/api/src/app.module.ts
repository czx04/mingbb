import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AdminModule } from "./admin/admin.module";
import { AppController } from "./app.controller";
import { BookingModule } from "./booking/booking.module";
import { MemberModule } from "./member/member.module";
import { RedisModule } from "./redis/redis.module";
import { SupabaseModule } from "./supabase/supabase.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    SupabaseModule,
    AdminModule,
    BookingModule,
    MemberModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
