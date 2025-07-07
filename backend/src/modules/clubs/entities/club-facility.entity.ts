import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToMany } from 'typeorm';
import { Club } from './club.entity';

@Entity('club_facilities')
export class ClubFacility {
  @PrimaryGeneratedColumn('increment') // Using increment for simpler IDs for master data
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string; // e.g., 'دوش', 'کمد', 'پارکینگ اختصاصی', 'بوفه', 'تهویه مطبوع'

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon_url?: string; // URL to an icon representing the facility

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Club, club => club.facilities)
  clubs: Club[]; // Relation for TypeORM, not strictly needed if only mapping from Club side
}
