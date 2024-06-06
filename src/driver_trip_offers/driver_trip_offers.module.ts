import { Module } from '@nestjs/common';
import { DriverTripOffersService } from './driver_trip_offers.service';
import { DriverTripOffersController } from './driver_trip_offers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverTripOffers } from './driver_trip_offers.entity';
import { User } from 'src/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DriverTripOffers, User])],
  providers: [DriverTripOffersService],
  controllers: [DriverTripOffersController],
})
export class DriverTripOffersModule {}
