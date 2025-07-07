import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Club } from './entities/club.entity';
import { ClubImage } from './entities/club-image.entity';
import { ClubFacility } from './entities/club-facility.entity';
import { SportType } from './entities/sport-type.entity';
import { Schedule } from './entities/schedule.entity';

// Services
import { ClubsService } from './services/clubs.service';
import { ClubFacilitiesService } from './services/club-facilities.service';
import { SportTypesService } from './services/sport-types.service';
import { SchedulesService } from './services/schedules.service';

// Controllers
import { ClubsController } from './controllers/clubs.controller';
import { ClubFacilitiesController } from './controllers/club-facilities.controller';
import { SportTypesController } from './controllers/sport-types.controller';
import { SchedulesController } from './controllers/schedules.controller';

import { AuthModule } from '../auth/auth.module'; // For guards
import { UsersModule } from '../users/users.module'; // If UsersService is needed by ClubsService for owner info

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Club,
      ClubImage,
      ClubFacility,
      SportType,
      Schedule,
    ]),
    forwardRef(() => AuthModule), // For JwtAuthGuard and RolesGuard
    // forwardRef(() => UsersModule), // If ClubsService directly uses UsersService and there's a circular dependency
                                 // Not strictly needed if only User entity or owner_id is used.
  ],
  controllers: [
    ClubsController,
    ClubFacilitiesController,
    SportTypesController,
    SchedulesController,
  ],
  providers: [
    ClubsService,
    ClubFacilitiesService,
    SportTypesService,
    SchedulesService,
  ],
  exports: [
    ClubsService, // Export if other modules need to interact with clubs directly
    SchedulesService, // Export if BookingService needs it
  ],
})
export class ClubsModule {}
