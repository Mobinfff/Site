import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Club } from './club.entity';

@Entity('club_images')
export class ClubImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Club, club => club.images, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @Column({type: 'uuid'})
  club_id: string;

  @Column({ type: 'varchar', length: 500 }) // URL can be long
  image_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  alt_text?: string;

  @Column({ type: 'boolean', default: false })
  is_cover: boolean; // To mark the main image for the club

  @Column({ type: 'int', default: 0 })
  display_order: number; // For ordering images

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  uploaded_at: Date;
}
