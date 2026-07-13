import { Body, Controller, Get, Post, Query } from "@nestjs/common";

import { AvailableBarbersQueryDto, AvailabilityQueryDto, CreateWebsiteBookingDto } from "./booking.dto";
import { BookingService } from "./booking.service";

@Controller("booking")
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get("catalog")
  catalog() {
    return this.bookingService.catalog();
  }

  @Get("availability")
  availability(@Query() query: AvailabilityQueryDto) {
    return this.bookingService.availability(query.date);
  }

  @Get("barbers")
  availableBarbers(@Query() query: AvailableBarbersQueryDto) {
    return this.bookingService.availableBarbers(query.date, query.time, query.serviceIds);
  }

  @Post("appointments")
  createAppointment(@Body() input: CreateWebsiteBookingDto) {
    return this.bookingService.createAppointment(input);
  }
}
