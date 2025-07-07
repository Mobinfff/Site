import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios'; // npm install axios

export interface ZarinpalRequestResponse {
  data: {
    code: number;
    message: string;
    authority?: string;
    fee_type?: string;
    fee?: number;
    // errors object for code 101
    errors?: any;
  } | []; // data can be an empty array on error code 101
  errors: any[]; // errors is an empty array on success
}

export interface ZarinpalVerificationResponse {
  data: {
    code: number;
    message: string;
    card_hash?: string;
    card_pan?: string;
    ref_id?: number; // This is the main success indicator along with code 100
    fee_type?: string;
    fee?: number;
     // errors object for code 101
    errors?: any;
  } | [];
  errors: any[];
}


@Injectable()
export class ZarinpalService {
  private readonly logger = new Logger(ZarinpalService.name);
  private readonly merchantId: string;
  private readonly isSandbox: boolean;
  private readonly client: AxiosInstance;
  private readonly requestUrl: string;
  private readonly verifyUrl: string;
  private readonly paymentBaseUrl: string;

  constructor(private configService: ConfigService) {
    this.merchantId = this.configService.get<string>('ZARINPAL_MERCHANT_ID');
    this.isSandbox = this.configService.get<string>('NODE_ENV') !== 'production' || this.configService.get<boolean>('ZARINPAL_SANDBOX', false); // Default to sandbox if not production

    const ZARINPAL_API_BASE = this.isSandbox
        ? 'https://sandbox.zarinpal.com/pg/rest'
        : 'https://api.zarinpal.com/pg/v4';

    this.requestUrl = `${ZARINPAL_API_BASE}/PaymentRequest.json`;
    this.verifyUrl = `${ZARINPAL_API_BASE}/PaymentVerification.json`;
    this.paymentBaseUrl = this.isSandbox
        ? 'https://sandbox.zarinpal.com/pg/StartPay'
        : 'https://www.zarinpal.com/pg/StartPay';


    if (!this.merchantId) {
      this.logger.error('ZARINPAL_MERCHANT_ID is not configured.');
      throw new Error('Zarinpal merchant ID is not configured.');
    }

    this.client = axios.create({
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  async createPaymentRequest(
    amount: number, // In Rials
    callbackUrl: string,
    description: string,
    email?: string,
    mobile?: string,
  ): Promise<{ authority: string; paymentLink: string }> {
    const payload = {
      merchant_id: this.merchantId,
      amount: amount, // Zarinpal expects amount in Rials
      callback_url: callbackUrl,
      description: description,
      metadata: {
        email: email,
        mobile: mobile,
      },
      // currency: "IRT" // If you want to send in Tomans, but then convert amount
    };

    this.logger.log(`Requesting payment from Zarinpal: ${JSON.stringify(payload)} to ${this.requestUrl}`);

    try {
      const response = await this.client.post<ZarinpalRequestResponse>(this.requestUrl, payload);
      this.logger.log(`Zarinpal PaymentRequest response: ${JSON.stringify(response.data)}`);

      const responseData = response.data;

      // Zarinpal returns data as an empty array and code 101 if validation errors occur.
      // Successful requests have data as an object with code 100.
      if (Array.isArray(responseData.data) && responseData.data.length === 0 && (responseData as any).errors && (responseData as any).errors.code === -9) { // A specific error code for Zarinpal sandbox merchant ID
          this.logger.error('Zarinpal PaymentRequest failed: Sandbox merchant ID error or invalid merchant ID', (responseData as any).errors);
          throw new HttpException('خطا در ارتباط با درگاه پرداخت: شناسه پذیرنده نامعتبر است.', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      if (!responseData || Array.isArray(responseData.data) || !responseData.data.authority || responseData.data.code !== 100) {
        let errorMessage = 'خطا در ایجاد درخواست پرداخت با زرین‌پال.';
        if (responseData && !Array.isArray(responseData.data) && responseData.data.message) {
            errorMessage = responseData.data.message;
        } else if (responseData && Array.isArray(responseData.data) && (responseData as any).errors) {
            errorMessage = `Zarinpal Error Code: ${(responseData as any).errors.code} - ${(responseData as any).errors.message}`;
        }
        this.logger.error(`Zarinpal PaymentRequest failed: ${errorMessage}`, responseData);
        throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const authority = responseData.data.authority;
      const paymentLink = `${this.paymentBaseUrl}/${authority}`;
      return { authority, paymentLink };

    } catch (error) {
      this.logger.error('Error calling Zarinpal PaymentRequest API:', error.response?.data || error.message);
      throw new HttpException(
        `خطا در ارتباط با درگاه پرداخت: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyPayment(
    amount: number, // In Rials
    authority: string,
  ): Promise<{ success: boolean; refId?: number; cardPan?: string; message: string; rawResponse: any }> {
    const payload = {
      merchant_id: this.merchantId,
      amount: amount, // Amount should be the same as requested
      authority: authority,
    };
    this.logger.log(`Verifying payment with Zarinpal: ${JSON.stringify(payload)} to ${this.verifyUrl}`);

    try {
      const response = await this.client.post<ZarinpalVerificationResponse>(this.verifyUrl, payload);
      this.logger.log(`Zarinpal PaymentVerification response: ${JSON.stringify(response.data)}`);

      const responseData = response.data;

      if (!responseData || Array.isArray(responseData.data)) {
        this.logger.error('Zarinpal PaymentVerification failed: Invalid response structure', responseData);
        return { success: false, message: 'پاسخ نامعتبر از درگاه پرداخت هنگام تایید.', rawResponse: responseData };
      }

      if (responseData.data.code === 100) { // Payment successful
        return {
          success: true,
          refId: responseData.data.ref_id,
          cardPan: responseData.data.card_pan,
          message: responseData.data.message || 'پرداخت با موفقیت تایید شد.',
          rawResponse: responseData,
        };
      } else if (responseData.data.code === 101) { // Already verified, still success
         this.logger.warn(`Zarinpal: Payment already verified (Code 101) for authority ${authority}. RefID: ${responseData.data.ref_id}`);
         return {
          success: true, // Treat as success if it's already verified
          refId: responseData.data.ref_id,
          cardPan: responseData.data.card_pan,
          message: responseData.data.message || 'تراکنش قبلا تایید شده است.',
          rawResponse: responseData,
        };
      }
      else { // Payment failed or other error
        const errorMessage = responseData.data.message || `خطای زرین‌پال کد: ${responseData.data.code}`;
        this.logger.error(`Zarinpal PaymentVerification failed: ${errorMessage}`, responseData);
        return { success: false, message: errorMessage, rawResponse: responseData };
      }
    } catch (error) {
      this.logger.error('Error calling Zarinpal PaymentVerification API:', error.response?.data || error.message);
      return {
        success: false,
        message: `خطا در ارتباط با درگاه پرداخت هنگام تایید: ${error.message}`,
        rawResponse: error.response?.data
      };
    }
  }
}
