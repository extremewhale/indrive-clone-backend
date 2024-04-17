import { Module } from '@nestjs/common';
import { DriverTripOffersService } from './driver_trip_offers.service';
import { DriverTripOffersController } from './driver_trip_offers.controller';

@Module({
  providers: [DriverTripOffersService],
  controllers: [DriverTripOffersController]
})
export class DriverTripOffersModule {}
