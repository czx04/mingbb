import { Body, Controller, Get, Post, Put, Req } from "@nestjs/common";
import { Request } from "express";

import { MemberLookupDto, MemberReviewDto } from "./member.dto";
import { MemberService } from "./member.service";

@Controller("members")
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get("reviews")
  publicReviews() {
    return this.memberService.publicReviews();
  }

  @Post("lookup")
  lookup(@Body() input: MemberLookupDto, @Req() request: Request) {
    return this.memberService.lookup(input.phone, request.ip || request.socket.remoteAddress || "unknown");
  }

  @Put("review")
  saveReview(@Body() input: MemberReviewDto, @Req() request: Request) {
    return this.memberService.saveReview(
      input,
      request.ip || request.socket.remoteAddress || "unknown",
    );
  }
}
