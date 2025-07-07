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
import { Schedule } from '../../clubs/entities/schedule.entity';
import { Club } from '../../clubs/entities/club.entity'; // For easier querying of club related to booking

export enum BookingStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT', // در انتظار پرداخت
  CONFIRMED = 'CONFIRMED',             // پرداخت موفق و رزرو قطعی شده
  CANCELLED_BY_USER = 'CANCELLED_BY_USER', // توسط کاربر لغو شده
  CANCELLED_BY_CLUB = 'CANCELLED_BY_CLUB', // توسط باشگاه لغو شده (مثلا به دلیل مشکل در سانس)
  CANCELLED_BY_ADMIN = 'CANCELLED_BY_ADMIN',// توسط ادمین لغو شده
  COMPLETED = 'COMPLETED',             // سانس استفاده شده/به پایان رسیده
  PAYMENT_FAILED = 'PAYMENT_FAILED',     // پرداخت ناموفق
  REFUND_REQUESTED = 'REFUND_REQUESTED', // درخواست بازگشت وجه ثبت شده
  REFUNDED = 'REFUNDED',               // وجه بازگردانده شده
}

@Entity('bookings')
@Index(['user_id', 'schedule_id', 'booking_date'], { unique: true, where: "status NOT IN ('CANCELLED_BY_USER', 'CANCELLED_BY_CLUB', 'CANCELLED_BY_ADMIN', 'PAYMENT_FAILED')" }) // Prevent duplicate active bookings
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, /*user => user.bookings,*/ { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => Schedule, /*schedule => schedule.bookings,*/ { nullable: false, eager: true }) // eager true to load schedule details with booking
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Index()
  @Column({ type: 'uuid' })
  schedule_id: string;

  // Denormalize club_id for easier querying and access, especially for club owner panel
  @ManyToOne(() => Club, { nullable: false, eager: false }) // Not eager by default, schedule already has club_id
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @Index()
  @Column({ type: 'uuid' })
  club_id: string;


  @Index()
  @Column({ type: 'date' }) // The specific date for which the schedule is booked
  booking_date: string; // YYYY-MM-DD format

  @Index()
  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING_PAYMENT,
  })
  status: BookingStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_price: number; // Price at the time of booking

  @Column({ type: 'varchar', length: 255, nullable: true })
  payment_gateway?: string; // e.g., 'zarinpal', 'payir'

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true, where: "payment_transaction_id IS NOT NULL" })
  payment_transaction_id?: string; // Transaction ID from payment gateway

  @Column({ type: 'timestamptz', nullable: true })
  payment_completed_at?: Date;

  @Column({ type: 'text', nullable: true })
  cancellation_reason?: string; // Reason if cancelled by club or admin

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at?: Date;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
