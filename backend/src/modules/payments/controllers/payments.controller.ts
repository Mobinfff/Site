import { Controller, Post, Body, Query, Get, Req, UseGuards, Res, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService, PaymentInitiationResponse, PaymentVerificationResult } from '../services/payments.service';
import { InitiatePaymentDto } from '../dto/initiate-payment.dto';
import { VerifyPaymentQueryDto } from '../dto/verify-payment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User as UserEntity } from '../../users/entities/user.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express'; // For redirect

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  private readonly frontendPaymentSuccessUrl: string;
  private readonly frontendPaymentFailureUrl: string;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {
    this.frontendPaymentSuccessUrl = this.configService.get<string>('FRONTEND_PAYMENT_SUCCESS_URL', '/profile/bookings?payment=success');
    this.frontendPaymentFailureUrl = this.configService.get<string>('FRONTEND_PAYMENT_FAILURE_URL', '/profile/bookings?payment=failed');
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a new payment for a booking' })
  @ApiResponse({ status: 200, description: 'Payment initiation successful, returns payment URL.', type: PaymentInitiationResponse })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async initiatePayment(
    @Req() req: { user: UserEntity },
    @Body() initiatePaymentDto: InitiatePaymentDto,
  ): Promise<PaymentInitiationResponse> {
    // Ensure callback_url in DTO is for our backend verify endpoint
    // The service will then use this to construct the actual gateway callback.
    // For security, the backend should ideally determine its own verify URL.
    const backendVerifyUrl = `${this.configService.get('APP_URL', 'http://localhost:3001')}/api/v1/payments/verify`;
    initiatePaymentDto.callback_url = backendVerifyUrl; // Override client-sent callback for security

    return this.paymentsService.initiatePayment(req.user, initiatePaymentDto);
  }

  @Get('verify') // This is the callback URL the payment gateway redirects to
  @ApiOperation({ summary: 'Verify payment after redirection from payment gateway (Callback)' })
  @ApiQuery({ type: VerifyPaymentQueryDto }) // Describes the query parameters
  @ApiResponse({ status: 302, description: 'Redirects to frontend success or failure page.' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., invalid parameters).' })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async verifyPayment(
    @Query() verifyPaymentDto: VerifyPaymentQueryDto, // NestJS automatically maps query params to DTO
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`Received payment verification callback with query: ${JSON.stringify(verifyPaymentDto)}`);
    try {
      const result: PaymentVerificationResult = await this.paymentsService.verifyPayment(verifyPaymentDto);

      let redirectUrl: string;
      if (result.success) {
        this.logger.log(`Payment verification successful for transaction ${result.transaction_id}, booking ${result.booking_id}. RefID: ${result.gateway_ref_id}`);
        redirectUrl = `${this.frontendPaymentSuccessUrl}&booking_id=${result.booking_id}&transaction_id=${result.transaction_id}`;
        if(result.gateway_ref_id) redirectUrl += `&ref_id=${result.gateway_ref_id}`;
      } else {
        this.logger.warn(`Payment verification failed for authority ${verifyPaymentDto.authority}: ${result.message}`);
        redirectUrl = `${this.frontendPaymentFailureUrl}&booking_id=${result.booking_id || 'N/A'}&message=${encodeURIComponent(result.message)}`;
      }
      res.redirect(HttpStatus.FOUND, redirectUrl);

    } catch (error) {
      this.logger.error(`Error during payment verification for authority ${verifyPaymentDto.authority}: ${error.message}`, error.stack);
      const failureMessage = error.response?.message || error.message || 'خطای داخلی در سرور هنگام تایید پرداخت.';
      const redirectUrl = `${this.frontendPaymentFailureUrl}&error=${encodeURIComponent(failureMessage)}`;
      res.redirect(HttpStatus.FOUND, redirectUrl);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('status/:transactionId')
  @ApiOperation({ summary: 'Get the status of a specific transaction (User)'})
  @ApiResponse({ status: 200, description: 'Transaction details.'}) // Define a TransactionResponseDto if needed
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 404, description: 'Transaction not found.'})
  async getTransactionStatus(
      @Param('transactionId', ParseUUIDPipe) transactionId: string,
      @Req() req: {user: UserEntity}
  ) {
      // Ensure user can only fetch their own transactions, or admin can fetch any.
      // The service method findTransactionByIdOrFail should handle this if userId is passed.
      return this.paymentsService.findTransactionByIdOrFail(transactionId, req.user.id);
  }
}
