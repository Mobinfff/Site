import { IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookingDto {
  @ApiPropertyOptional({
    description: 'New status for the booking (for Admin use mostly)',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(BookingStatus, { message: `وضعیت رزرو باید یکی از مقادیر ${Object.values(BookingStatus).join(', ')} باشد.` })
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Reason for cancellation if changed by admin or club',
    example: 'Club maintenance',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'دلیل لغو نمی‌تواند بیشتر از 500 کاراکتر باشد.'})
  cancellation_reason?: string;

  // Other fields that an admin might be allowed to update, e.g., payment_transaction_id if manually reconciling
  @ApiPropertyOptional({
    description: 'Payment transaction ID, if manually updated by admin.',
    example: 'TXN123456789',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  payment_transaction_id?: string;
}
