import { IsString, Matches } from "class-validator";

export class MemberLookupDto {
  @IsString()
  @Matches(/^0\d{9}$/)
  phone!: string;
}
