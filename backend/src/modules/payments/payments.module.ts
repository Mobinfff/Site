import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { PaymentsService } from './services/payments.service';
import { PaymentsController } from './controllers/payments.controller';
import { ZarinpalService } from './services/zarinpal.service'; // Example gateway service
import { ConfigModule } from '@nestjs/config'; // For ZarinpalService to get merchant ID etc.
import { BookingsModule } from '../bookings/bookings.module'; // For Booking entity and BookingsService
import { AuthModule } from '../auth/auth.module'; // For JwtAuthGuard

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    ConfigModule, // Make ConfigService available
    forwardRef(() => BookingsModule), // BookingsService is used by PaymentsService
    forwardRef(() => AuthModule), // For guards
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    ZarinpalService, // Register ZarinpalService (or other gateway services)
  ],
  exports: [PaymentsService], // Export if any other module needs to directly call PaymentsService
})
export class PaymentsModule {}
