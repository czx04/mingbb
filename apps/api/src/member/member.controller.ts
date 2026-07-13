import { Body, Controller, Post, Req } from "@nestjs/common";
import { Request } from "express";

import { MemberLookupDto } from "./member.dto";
import { MemberService } from "./member.service";

@Controller("members")
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post("lookup")
  lookup(@Body() input: MemberLookupDto, @Req() request: Request) {
    return this.memberService.lookup(input.phone, request.ip || request.socket.remoteAddress || "unknown");
  }
}
