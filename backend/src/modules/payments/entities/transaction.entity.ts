import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity'; // Assuming Booking entity is in bookings module

export enum TransactionType {
  PAYMENT = 'PAYMENT',     // پرداخت برای رزرو یا سایر خدمات
  REFUND = 'REFUND',       // بازگشت وجه
  WITHDRAWAL = 'WITHDRAWAL', // برداشت وجه توسط باشگاه‌دار (در آینده)
  DEPOSIT = 'DEPOSIT',     // واریز وجه (مثلا شارژ کیف پول کاربر - در آینده)
}

export enum TransactionStatus {
  PENDING = 'PENDING',     // تراکنش ایجاد شده، در انتظار نتیجه از درگاه
  SUCCESSFUL = 'SUCCESSFUL', // تراکنش موفق
  FAILED = 'FAILED',       // تراکنش ناموفق
  CANCELLED = 'CANCELLED',   // تراکنش توسط کاربر یا سیستم لغو شده قبل از ارسال به درگاه
}

export enum PaymentGateway {
    ZARINPAL = 'ZARINPAL',
    PAYIR = 'PAYIR',
    MELLAT = 'MELLAT',
    SYSTEM = 'SYSTEM', // For internal transactions like wallet
    // Add other gateways as needed
}


@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => Booking, { nullable: true }) // A transaction might not always be tied to a booking (e.g., wallet top-up)
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  booking_id?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: PaymentGateway,
    nullable: true, // Might be null if it's an internal system transaction
  })
  gateway?: PaymentGateway;

  @Index({ unique: true, where: "gateway_transaction_id IS NOT NULL" })
  @Column({ type: 'varchar', length: 255, nullable: true })
  gateway_transaction_id?: string; // شناسه یکتای تراکنش در درگاه پرداخت (e.g., Authority for Zarinpal)

  @Index({ unique: true, where: "gateway_payment_reference_id IS NOT NULL" })
  @Column({ type: 'varchar', length: 255, nullable: true })
  gateway_payment_reference_id?: string; // شناسه پیگیری پرداخت پس از موفقیت (e.g., RefID for Zarinpal)


  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true })
  description?: string; // توضیحات اضافی، یا پیام خطای درگاه

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // برای ذخیره اطلاعات اضافی از درگاه یا سیستم

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
