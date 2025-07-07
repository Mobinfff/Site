import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
// import { Booking } from '../../bookings/entities/booking.entity';
// import { Club } from '../../clubs/entities/club.entity';
// import { Review } from '../../reviews/entities/review.entity';
// import { Notification } from '../../notifications/entities/notification.entity';

export enum UserRole {
  USER = 'USER',
  CLUB_OWNER = 'CLUB_OWNER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  phone_number: string;

  @Column({ type: 'varchar', nullable: true })
  password?: string; // Hashed password

  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name?: string;

  @Index({ unique: true, where: "email IS NOT NULL" }) // Partial index for unique non-null emails
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'varchar', nullable: true })
  profile_image_url?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_phone_verified: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // --- Relations ---
  // @OneToMany(() => Club, club => club.owner)
  // owned_clubs: Club[];

  // @OneToMany(() => Booking, booking => booking.user)
  // bookings: Booking[];

  // @OneToMany(() => Review, review => review.user)
  // reviews: Review[];

  // @OneToMany(() => Notification, notification => notification.user)
  // notifications: Notification[];


  // TODO: Add methods for password hashing and comparison if needed directly in entity (or better in service)
}
