import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// This DTO is generic. Specific gateways might have more or different params.
// For Zarinpal, it would be 'Authority' and 'Status'.
// We'll make it adaptable or create specific DTOs per gateway if needed.

export class VerifyPaymentQueryDto {
  @ApiProperty({
    description: 'Unique transaction authority or ID provided by the payment gateway before redirect.',
    example: 'A00000000000000000000000000037215082', // Zarinpal Authority example
  })
  @IsNotEmpty({ message: 'شناسه تراکنش درگاه (Authority) نباید خالی باشد.' })
  @IsString()
  authority: string; // Example for Zarinpal: 'Authority'

  @ApiProperty({
    description: 'Status of the payment attempt, returned by the gateway.',
    example: 'OK', // Zarinpal Status example for success
  })
  @IsNotEmpty({ message: 'وضعیت پرداخت (Status) نباید خالی باشد.' })
  @IsString()
  status: string; // Example for Zarinpal: 'Status' (OK or NOK)

  // Some gateways might include other parameters like a transaction reference ID or order ID in the callback.
  // We might also pass our internal transaction ID (from `transactions` table) to the gateway and get it back.
  @ApiProperty({
    description: 'Internal transaction ID, if passed to and returned by the gateway.',
    required: false,
  })
  @IsOptional()
  @IsString() // Could be UUID
  internal_transaction_id?: string;
}
