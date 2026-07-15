import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common";

import {
  BarberInputDto,
  AssignBarberDto,
  CreateAppointmentDto,
  ReplaceShiftsDto,
  ReviewVisibilityDto,
  ServiceInputDto,
  UpdateAppointmentStatusDto
} from "./admin.dto";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("bootstrap")
  bootstrap() {
    return this.adminService.bootstrap();
  }

  @Post("services")
  createService(@Body() input: ServiceInputDto) {
    return this.adminService.createService(input);
  }

  @Put("services/:id")
  updateService(@Param("id") id: string, @Body() input: ServiceInputDto) {
    return this.adminService.updateService(id, input);
  }

  @Delete("services/:id")
  archiveService(@Param("id") id: string) {
    return this.adminService.archiveService(id);
  }

  @Post("barbers")
  createBarber(@Body() input: BarberInputDto) {
    return this.adminService.createBarber(input);
  }

  @Put("barbers/:id")
  updateBarber(@Param("id") id: string, @Body() input: BarberInputDto) {
    return this.adminService.updateBarber(id, input);
  }

  @Delete("barbers/:id")
  archiveBarber(@Param("id") id: string) {
    return this.adminService.archiveBarber(id);
  }

  @Put("barbers/:barberId/shifts/:date")
  replaceShifts(@Param("barberId") barberId: string, @Param("date") date: string, @Body() input: ReplaceShiftsDto) {
    return this.adminService.replaceShifts(barberId, date, input);
  }

  @Post("appointments")
  createAppointment(@Body() input: CreateAppointmentDto) {
    return this.adminService.createAppointment(input);
  }

  @Patch("appointments/:id/status")
  updateAppointmentStatus(@Param("id") id: string, @Body() input: UpdateAppointmentStatusDto) {
    return this.adminService.updateAppointmentStatus(id, input);
  }

  @Patch("appointments/:id/barber")
  assignBarber(@Param("id") id: string, @Body() input: AssignBarberDto) {
    return this.adminService.assignBarber(id, input.barberId);
  }

  @Patch("reviews/:customerId/visibility")
  updateReviewVisibility(
    @Param("customerId") customerId: string,
    @Body() input: ReviewVisibilityDto,
  ) {
    return this.adminService.updateReviewVisibility(customerId, input.visible);
  }
}
