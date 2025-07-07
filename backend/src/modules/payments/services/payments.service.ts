import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus, TransactionType, PaymentGateway } from '../entities/transaction.entity';
import { InitiatePaymentDto } from '../dto/initiate-payment.dto';
import { VerifyPaymentQueryDto } from '../dto/verify-payment.dto';
import { Booking, BookingStatus } from '../../bookings/entities/booking.entity';
import { BookingsService } from '../../bookings/services/bookings.service';
import { User } from '../../users/entities/user.entity';
import { ZarinpalService } from './zarinpal.service'; // Assuming Zarinpal for now
import { ConfigService } from '@nestjs/config';

export interface PaymentInitiationResponse {
  payment_url: string;
  transaction_id: string; // Our internal transaction ID
  gateway_transaction_id: string; // Authority from Zarinpal
}

export interface PaymentVerificationResult {
    success: boolean;
    message: string;
    booking_id?: string;
    transaction_id?: string; // Our internal transaction ID
    gateway_ref_id?: string; // RefID from Zarinpal
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly bookingsService: BookingsService,
    private readonly zarinpalService: ZarinpalService, // Example, could be a generic gateway service
    private readonly configService: ConfigService,
  ) {}

  async initiatePayment(currentUser: User, initiateDto: InitiatePaymentDto): Promise<PaymentInitiationResponse> {
    const { booking_id, callback_url, gateway: preferredGateway } = initiateDto;

    const booking = await this.bookingRepository.findOne({
      where: { id: booking_id, user_id: currentUser.id },
      relations: ['schedule'], // Need schedule for price
    });

    if (!booking) {
      throw new NotFoundException(`رزروی با شناسه '${booking_id}' برای شما یافت نشد.`);
    }
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(`این رزرو در وضعیت '${booking.status}' بوده و امکان شروع پرداخت برای آن وجود ندارد.`);
    }
    if (!booking.schedule || typeof booking.schedule.price !== 'number') {
        throw new InternalServerErrorException('اطلاعات قیمت سانس برای این رزرو موجود نیست.');
    }

    const amount = booking.total_price; // Amount in Rials (ensure booking.total_price is in Rials)
    const description = `پرداخت برای رزرو سانس ${booking.schedule.name || 'باشگاه'} به تاریخ ${booking.booking_date}`;

    // For now, hardcode Zarinpal. In future, can select based on `preferredGateway`
    const selectedGateway = PaymentGateway.ZARINPAL;

    // Create an internal transaction record
    let transaction = this.transactionRepository.create({
      user_id: currentUser.id,
      booking_id: booking.id,
      amount: amount,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.PENDING,
      gateway: selectedGateway,
      description: `Initiating payment for booking ${booking.id}`,
    });

    try {
        transaction = await this.transactionRepository.save(transaction);
    } catch (dbError) {
        this.logger.error(`Error saving initial transaction for booking ${booking.id}: ${dbError.message}`, dbError.stack);
        throw new InternalServerErrorException('خطا در ثبت اولیه تراکنش پرداخت.');
    }


    try {
      // TODO: Choose gateway service based on selectedGateway
      if (selectedGateway === PaymentGateway.ZARINPAL) {
        const { authority, paymentLink } = await this.zarinpalService.createPaymentRequest(
          amount,
          callback_url, // This should be our backend verify endpoint, then redirect to frontend
          description,
          currentUser.email,
          currentUser.phone_number,
        );

        // Update our transaction record with the gateway's transaction ID (Authority)
        transaction.gateway_transaction_id = authority;
        await this.transactionRepository.save(transaction);

        return {
          payment_url: paymentLink,
          transaction_id: transaction.id,
          gateway_transaction_id: authority,
        };
      } else {
        throw new BadRequestException('درگاه پرداخت انتخاب شده در حال حاضر پشتیبانی نمی‌شود.');
      }
    } catch (gatewayError) {
      this.logger.error(`Gateway error during payment initiation for transaction ${transaction.id}: ${gatewayError.message}`, gatewayError.stack);
      transaction.status = TransactionStatus.FAILED;
      transaction.description = gatewayError.message || 'خطای نامشخص از درگاه پرداخت هنگام شروع پرداخت.';
      await this.transactionRepository.save(transaction); // Save failed status
      // Re-throw as HttpException or a more specific error
      if (gatewayError instanceof HttpException) throw gatewayError;
      throw new HttpException(gatewayError.message || 'خطا در ارتباط با درگاه پرداخت.', gatewayError.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyPayment(queryDto: VerifyPaymentQueryDto): Promise<PaymentVerificationResult> {
    const { authority, status: gatewayStatus, internal_transaction_id } = queryDto;

    // Find our internal transaction using the authority (gateway_transaction_id)
    // Or use internal_transaction_id if we passed it to gateway and got it back
    const transaction = await this.transactionRepository.findOne({
      where: { gateway_transaction_id: authority, status: TransactionStatus.PENDING },
      relations: ['booking'], // Need booking to update its status
    });

    if (!transaction) {
      this.logger.error(`تراکنش معلق با شناسه درگاه '${authority}' یافت نشد.`);
      // It might be already processed, or it's an invalid/tampered callback.
      // Check if it was already successful to handle browser refresh on callback URL.
      const alreadyProcessedTx = await this.transactionRepository.findOneBy({ gateway_transaction_id: authority, status: TransactionStatus.SUCCESSFUL });
      if (alreadyProcessedTx) {
          this.logger.warn(`تراکنش ${authority} قبلا با موفقیت پردازش شده است.`);
          return { success: true, message: 'تراکنش قبلا با موفقیت تایید شده است.', booking_id: alreadyProcessedTx.booking_id, transaction_id: alreadyProcessedTx.id, gateway_ref_id: alreadyProcessedTx.gateway_payment_reference_id };
      }
      throw new NotFoundException('تراکنش پرداخت معتبری برای تایید یافت نشد. ممکن است منقضی شده یا قبلا پردازش شده باشد.');
    }

    if (!transaction.booking) {
        this.logger.error(`تراکنش ${transaction.id} فاقد رزرو مرتبط است.`);
        transaction.status = TransactionStatus.FAILED;
        transaction.description = 'رزرو مرتبط با تراکنش یافت نشد.';
        await this.transactionRepository.save(transaction);
        throw new InternalServerErrorException('خطا: رزرو مرتبط با این تراکنش یافت نشد.');
    }

    const amount = transaction.amount; // Amount in Rials

    // TODO: Choose gateway service based on transaction.gateway
    if (transaction.gateway === PaymentGateway.ZARINPAL) {
      if (gatewayStatus !== 'OK') { // Payment was not successful or was cancelled by user at Zarinpal
        this.logger.warn(`Zarinpal payment not OK for authority ${authority}. Status: ${gatewayStatus}`);
        transaction.status = TransactionStatus.FAILED;
        transaction.description = `پرداخت توسط کاربر لغو شد یا در درگاه ناموفق بود. وضعیت درگاه: ${gatewayStatus}`;
        await this.transactionRepository.save(transaction);
        await this.bookingsService.handleFailedPayment(transaction.booking_id);
        return { success: false, message: transaction.description, booking_id: transaction.booking_id, transaction_id: transaction.id };
      }

      // If status is OK, verify with Zarinpal server
      const verification = await this.zarinpalService.verifyPayment(amount, authority);
      transaction.metadata = { ...transaction.metadata, zarinpal_verify_response: verification.rawResponse };


      if (verification.success && verification.refId) {
        transaction.status = TransactionStatus.SUCCESSFUL;
        transaction.gateway_payment_reference_id = verification.refId.toString();
        transaction.description = verification.message || 'پرداخت با موفقیت تایید شد.';
        await this.transactionRepository.save(transaction);

        // IMPORTANT: Now update the booking status
        await this.bookingsService.confirmBookingPayment(
          transaction.booking_id,
          PaymentGateway.ZARINPAL, // or transaction.gateway
          transaction.id, // Our internal transaction ID as reference, or gateway_payment_reference_id
        );
        return {
            success: true,
            message: transaction.description,
            booking_id: transaction.booking_id,
            transaction_id: transaction.id,
            gateway_ref_id: transaction.gateway_payment_reference_id
        };
      } else {
        transaction.status = TransactionStatus.FAILED;
        transaction.description = verification.message || 'تایید پرداخت با زرین‌پال ناموفق بود.';
        await this.transactionRepository.save(transaction);
        await this.bookingsService.handleFailedPayment(transaction.booking_id);
        return { success: false, message: transaction.description, booking_id: transaction.booking_id, transaction_id: transaction.id };
      }
    } else {
      this.logger.error(`درگاه پرداخت '${transaction.gateway}' برای تراکنش ${transaction.id} پشتیبانی نمی‌شود.`);
      transaction.status = TransactionStatus.FAILED;
      transaction.description = 'درگاه پرداخت پشتیبانی نشده است.';
      await this.transactionRepository.save(transaction);
      // No booking update here as the gateway is unknown.
      throw new InternalServerErrorException('درگاه پرداخت این تراکنش پشتیبانی نمی‌شود.');
    }
  }

  async findTransactionById(id: string, userId?: string): Promise<Transaction | null> {
    const transaction = await this.transactionRepository.findOneBy(userId ? { id, user_id: userId } : { id });
    if (!transaction) {
        return null;
    }
    return transaction;
  }

  async findTransactionByIdOrFail(id: string, userId?: string): Promise<Transaction> {
    const transaction = await this.findTransactionById(id, userId);
    if (!transaction) {
        throw new NotFoundException(`تراکنشی با شناسه ${id} یافت نشد.`);
    }
    return transaction;
  }
}
