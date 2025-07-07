import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './create-schedule.dto';
import { IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ScheduleStatus } from '../entities/schedule.entity';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {
  // All fields from CreateScheduleDto are optional.
  // We can add specific overrides if needed.

  // Example: current_occupancy is usually managed by the system (bookings), not directly via update DTO
  // So we ensure it's not part of this DTO or ignore it if passed.

  @IsOptional()
  @IsBoolean({ message: 'وضعیت فعالیت سانس (is_active) باید true یا false باشد.'})
  is_active?: boolean;

  @IsOptional()
  @IsEnum(ScheduleStatus, { message: `وضعیت سانس باید یکی از مقادیر ${Object.values(ScheduleStatus).join(', ')} باشد.` })
  schedule_status?: ScheduleStatus;
}
