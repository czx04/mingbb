import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested
} from "class-validator";

export class AvailabilityQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;
}

export class AvailableBarbersQueryDto extends AvailabilityQueryDto {
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  time!: string;

  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value.flatMap((item) => String(item).split(",")).filter(Boolean)
      : String(value ?? "").split(",").filter(Boolean)
  )
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  serviceIds!: string[];
}

export class BookingCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @IsString()
  @Matches(/^0\d{9}$/)
  phone!: string;
}

export class CustomerLookupDto {
  @IsString()
  @Matches(/^0\d{9}$/)
  phone!: string;
}

export class CreateWebsiteBookingDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  time!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  serviceIds!: string[];

  @IsOptional()
  @IsUUID("4")
  barberId?: string | null;

  @ValidateNested()
  @Type(() => BookingCustomerDto)
  customer!: BookingCustomerDto;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => String(value ?? "").trim().toUpperCase())
  @IsString()
  @Matches(/^[A-Z0-9]{5}$/)
  @MaxLength(5)
  referralCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
