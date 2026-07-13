import { Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested
} from "class-validator";

export const appointmentStatuses = [
  "pending",
  "confirmed",
  "in_service",
  "completed",
  "cancelled",
  "no_show"
] as const;

export class ServiceInputDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(5)
  @Max(720)
  duration!: number;

  @IsInt()
  @Min(0)
  price!: number;

  @IsBoolean()
  active!: boolean;

  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  barberIds!: string[];
}

export class BarberInputDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  detail!: string;

  @IsBoolean()
  active!: boolean;

  @IsString()
  @Matches(/^.{1,3}$/u)
  initials!: string;

  @IsString()
  color!: string;
}

export class ShiftInputDto {
  @IsOptional()
  @IsUUID("4")
  id?: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  from!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  to!: string;
}

export class ReplaceShiftsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftInputDto)
  shifts!: ShiftInputDto[];
}

export class CreateAppointmentDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  from!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  to!: string;

  @IsString()
  @IsNotEmpty()
  customer!: string;

  @IsPhoneNumber("VN")
  phone!: string;

  @IsUUID("4")
  serviceId!: string;

  @IsOptional()
  @IsUUID("4")
  barberId?: string | null;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateAppointmentStatusDto {
  @IsIn(appointmentStatuses)
  status!: (typeof appointmentStatuses)[number];

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AssignBarberDto {
  @IsUUID("4")
  barberId!: string;
}
