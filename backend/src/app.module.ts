import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
// import { AdminModule } from './modules/admin/admin.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';
// import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      // ನೀವು ಬಯಸಿದರೆ ಇಲ್ಲಿ ಹೆಚ್ಚಿನ ಕಾನ್ಫಿಗರೇಶನ್ ಫೈಲ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಬಹುದು
      // load: [appConfig, dbConfig, jwtConfig],
    }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    UsersModule,
    AuthModule,
    ClubsModule,
    BookingsModule,
    PaymentsModule,
    // AdminModule,
    // NotificationsModule,
    // UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
