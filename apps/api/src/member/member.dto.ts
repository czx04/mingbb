import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";

export class MemberLookupDto {
  @IsString()
  @Matches(/^0\d{9}$/)
  phone!: string;
}

export class MemberReviewDto {
  @IsString()
  @Matches(/^0\d{9}$/)
  phone!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
