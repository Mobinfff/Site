import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ClubImage } from './club-image.entity';
import { Schedule } from './schedule.entity';
import { ClubFacility } from './club-facility.entity';
import { SportType } from './sport-type.entity';
// import { Review } from '../../reviews/entities/review.entity'; // If Review entity is created

export enum ClubStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL', // در انتظار تایید
  APPROVED = 'APPROVED',                 // تایید شده
  REJECTED = 'REJECTED',                 // رد شده
  TEMPORARILY_CLOSED = 'TEMPORARILY_CLOSED', // موقتا بسته شده
  PERMANENTLY_CLOSED = 'PERMANENTLY_CLOSED', // برای همیشه بسته شده
}

@Entity('clubs')
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, /*user => user.owned_clubs,*/ { nullable: false, eager: false }) // eager false to avoid loading user always
  @JoinColumn({ name: 'owner_id' })
  owner: User; // Store the full user object or just owner_id: string; and load manually

  @Column({ type: 'uuid' })
  owner_id: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone_number?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ClubStatus,
    default: ClubStatus.PENDING_APPROVAL,
  })
  status: ClubStatus;

  @Column({ type: 'boolean', default: true })
  is_active: boolean; // Managed by club owner (e.g., for vacations)

  @Column({ type: 'text', nullable: true })
  rejection_reason?: string; // If status is REJECTED

  @Column({ type: 'boolean', default: false })
  is_featured: boolean; // For admin to feature a club

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // --- Relations ---
  @OneToMany(() => ClubImage, image => image.club, { cascade: true, eager: true }) // eager true to load images with club
  images: ClubImage[];

  @OneToMany(() => Schedule, schedule => schedule.club, { cascade: true }) // Not eager by default
  schedules: Schedule[];

  @ManyToMany(() => ClubFacility, facility => facility.clubs, { cascade: ['insert', 'update'], eager: true })
  @JoinTable({
    name: 'club_facility_mappings',
    joinColumn: { name: 'club_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'facility_id', referencedColumnName: 'id' },
  })
  facilities: ClubFacility[];

  @ManyToMany(() => SportType, sportType => sportType.clubs, { cascade: ['insert', 'update'], eager: true })
  @JoinTable({
    name: 'club_sport_type_mappings',
    joinColumn: { name: 'club_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'sport_type_id', referencedColumnName: 'id' },
  })
  sport_types: SportType[];

  // @OneToMany(() => Review, review => review.club)
  // reviews: Review[];

  // Calculated/Aggregated fields (not directly in DB, but can be added via query or as @VirtualColumn)
  // average_rating: number;
  // review_count: number;
}
