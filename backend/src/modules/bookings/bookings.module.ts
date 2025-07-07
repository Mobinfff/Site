import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingsService } from './services/bookings.service';
import { BookingsController } from './controllers/bookings.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module'; // For User entity if needed for relations
import { ClubsModule } from '../clubs/clubs.module'; // For Schedule entity, Club entity and SchedulesService

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    forwardRef(() => AuthModule), // For JwtAuthGuard, RolesGuard
    forwardRef(() => UsersModule), // If User entity is directly used in service/controller beyond req.user
    forwardRef(() => ClubsModule), // For Schedule, Club entities and SchedulesService
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService], // Export if PaymentService or NotificationService needs it
})
export class BookingsModule {}
