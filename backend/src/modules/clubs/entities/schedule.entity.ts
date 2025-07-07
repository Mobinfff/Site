import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  // OneToMany,
} from 'typeorm';
import { Club } from './club.entity';
import { SportType } from './sport-type.entity';
// import { Booking } from '../../bookings/entities/booking.entity';

export enum GenderSpecific {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  BOTH = 'BOTH', // مختلط یا بدون محدودیت جنسیتی
}

export enum ScheduleStatus {
  OPEN = 'OPEN',         // سانس برای رزرو باز است
  CLOSED = 'CLOSED',       // سانس توسط باشگاه‌دار بسته شده است (مثلاً برای تعمیرات یا رویداد خاص)
  FULL = 'FULL',         // ظرفیت سانس تکمیل شده است
  CANCELLED = 'CANCELLED',   // سانس لغو شده است (مثلاً به دلیل عدم رسیدن به حد نصاب)
}

// Store days as numbers: 0 (Sunday) to 6 (Saturday)
// Or as strings: 'SUNDAY', 'MONDAY', ...
// JSONB is flexible for this.
// Example: [0, 2, 4] for Sunday, Tuesday, Thursday

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Club, club => club.schedules, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @Column({type: 'uuid'})
  club_id: string;

  @ManyToOne(() => SportType, /*sport => sport.schedules,*/ { nullable: true, eager: true }) // Eager load sport type if always needed
  @JoinColumn({ name: 'sport_type_id' })
  sport_type?: SportType; // A schedule can be for a specific sport or general

  @Column({ type: 'integer', name: 'sport_type_id', nullable: true })
  sport_type_id?: number;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string; // e.g., "سانس صبحگاهی بدنسازی آقایان", "کلاس یوگا عصر"

  @Column({ type: 'time' }) // HH:MM:SS
  start_time: string;

  @Column({ type: 'time' }) // HH:MM:SS
  end_time: string;

  @Column({ type: 'jsonb', comment: "Array of day numbers (0=Sunday, 6=Saturday) or day names ['SUNDAY', ...]"})
  days_of_week: (number[] | string[]); // e.g., [0, 2, 4] for Sun, Tue, Thu

  @Column({ type: 'integer' })
  capacity: number; // Max number of people for this schedule

  @Column({ type: 'integer', default: 0 })
  current_occupancy: number; // Number of current bookings for a specific date (might be better in a separate table for specific instances)
                               // For simplicity here, could be reset daily or managed carefully.
                               // A better approach: ScheduleInstance table for each date.

  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.OPEN,
  })
  schedule_status: ScheduleStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 }) // Support larger prices
  price: number;

  @Column({
    type: 'enum',
    enum: GenderSpecific,
    default: GenderSpecific.BOTH,
  })
  gender: GenderSpecific;

  @Column({ type: 'boolean', default: true })
  is_active: boolean; // Club owner can activate/deactivate a schedule template

  @Column({ type: 'date', nullable: true })
  valid_from?: Date; // Schedule is valid from this date

  @Column({ type: 'date', nullable: true })
  valid_until?: Date; // Schedule is valid until this date (for temporary schedules)

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // --- Relations ---
  // @OneToMany(() => Booking, booking => booking.schedule)
  // bookings: Booking[];
}
