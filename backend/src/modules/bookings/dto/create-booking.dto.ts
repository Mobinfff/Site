import { IsNotEmpty, IsUUID, IsDateString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID of the schedule to be booked',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty({ message: 'شناسه سانس نباید خالی باشد.' })
  @IsUUID('4', { message: 'فرمت شناسه سانس نامعتبر است.' })
  schedule_id: string;

  @ApiProperty({
    description: 'Date for the booking (YYYY-MM-DD)',
    example: '2024-07-15',
  })
  @IsNotEmpty({ message: 'تاریخ رزرو نباید خالی باشد.' })
  @IsDateString({}, { message: 'فرمت تاریخ رزرو نامعتبر است (YYYY-MM-DD).' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'فرمت تاریخ رزرو باید YYYY-MM-DD باشد.'})
  booking_date: string;

  // user_id will be taken from the authenticated user (request context)
  // total_price will be calculated based on the schedule's price
  // status will be set by the system (e.g., PENDING_PAYMENT)
}
