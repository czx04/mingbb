import { Module } from "@nestjs/common";

import { RedisModule } from "../redis/redis.module";
import { SupabaseModule } from "../supabase/supabase.module";
import { MemberController } from "./member.controller";
import { MemberService } from "./member.service";

@Module({
  imports: [RedisModule, SupabaseModule],
  controllers: [MemberController],
  providers: [MemberService]
})
export class MemberModule {}
