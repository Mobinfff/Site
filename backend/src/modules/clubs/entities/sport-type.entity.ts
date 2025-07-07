import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany } from 'typeorm';
import { Club } from './club.entity';
// import { Schedule } from './schedule.entity'; // If Schedule has a direct relation to SportType

@Entity('sport_types')
export class SportType {
  @PrimaryGeneratedColumn('increment') // Using increment for simpler IDs for master data
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string; // e.g., 'بدنسازی', 'یوگا', 'پیلاتس', 'TRX', 'زومبا', 'شنا'

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon_url?: string; // URL to an icon representing the sport type

  @Column({ type: 'boolean', default: true })
  is_active: boolean; // Admin can deactivate a sport type globally

  @ManyToMany(() => Club, club => club.sport_types)
  clubs: Club[];

  // @OneToMany(() => Schedule, schedule => schedule.sport_type)
  // schedules: Schedule[];
}
