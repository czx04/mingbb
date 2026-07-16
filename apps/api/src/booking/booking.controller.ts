import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import { Request } from "express";

import {
  AvailableBarbersQueryDto,
  AvailabilityQueryDto,
  CreateWebsiteBookingDto,
  CustomerLookupDto,
} from "./booking.dto";
import { BookingService } from "./booking.service";

@Controller("booking")
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get("catalog")
  catalog() {
    return this.bookingService.catalog();
  }

  @Get("services")
  publicServices() {
    return this.bookingService.publicServices();
  }

  @Get("availability")
  availability(@Query() query: AvailabilityQueryDto) {
    return this.bookingService.availability(query.date);
  }

  @Get("barbers")
  availableBarbers(@Query() query: AvailableBarbersQueryDto) {
    return this.bookingService.availableBarbers(
      query.date,
      query.time,
      query.serviceIds,
    );
  }

  @Post("appointments")
  createAppointment(
    @Body() input: CreateWebsiteBookingDto,
    @Req() request: Request,
  ) {
    return this.bookingService.createAppointment(
      input,
      request.ip || request.socket.remoteAddress || "unknown",
    );
  }

  @Post("customers/lookup")
  lookupCustomer(@Body() input: CustomerLookupDto, @Req() request: Request) {
    return this.bookingService.lookupCustomer(
      input.phone,
      request.ip || request.socket.remoteAddress || "unknown",
    );
  }
}
