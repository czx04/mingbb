import { Module } from "@nestjs/common";

import { SupabaseModule } from "../supabase/supabase.module";
import { MemberController } from "./member.controller";
import { MemberService } from "./member.service";

@Module({
  imports: [SupabaseModule],
  controllers: [MemberController],
  providers: [MemberService]
})
export class MemberModule {}
