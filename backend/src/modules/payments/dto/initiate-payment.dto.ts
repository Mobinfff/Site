import { IsNotEmpty, IsUUID, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentGateway } from '../entities/transaction.entity';

export class InitiatePaymentDto {
  @ApiProperty({
    description: 'ID of the booking for which payment is being initiated',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty({ message: 'شناسه رزرو نباید خالی باشد.' })
  @IsUUID('4', { message: 'فرمت شناسه رزرو نامعتبر است.' })
  booking_id: string;

  // Amount will be derived from the booking, not taken as input here to prevent tampering.
  // @IsNotEmpty()
  // @IsNumber({ maxDecimalPlaces: 2 })
  // @Min(1000) // Minimum amount e.g. 1000 Rials
  // amount: number;

  @ApiProperty({
    description: 'Callback URL to redirect the user to after payment attempt from payment gateway.',
    example: 'https://fitclub.app/payment/callback',
  })
  @IsNotEmpty({ message: 'آدرس URL بازگشت نباید خالی باشد.'})
  @IsUrl({}, {require_tld: process.env.NODE_ENV === 'production'}) // TLD check only in production
  callback_url: string;

  @ApiProperty({
    description: 'Optional: Preferred payment gateway by user, if multiple are supported.',
    enum: PaymentGateway,
    required: false,
    example: PaymentGateway.ZARINPAL,
  })
  @IsOptional()
  @IsEnum(PaymentGateway, {message: 'درگاه پرداخت انتخاب شده معتبر نیست.'})
  gateway?: PaymentGateway; // If you allow user to choose gateway
}
