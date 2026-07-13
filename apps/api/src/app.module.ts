import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AdminModule } from "./admin/admin.module";
import { AppController } from "./app.controller";
import { BookingModule } from "./booking/booking.module";
import { MemberModule } from "./member/member.module";
import { SupabaseModule } from "./supabase/supabase.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    SupabaseModule,
    AdminModule,
    BookingModule,
    MemberModule
  ],
  controllers: [AppController]
})
export class AppModule {}
