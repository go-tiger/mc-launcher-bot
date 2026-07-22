import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class GuildSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  guild: string;

  @Column({ nullable: true })
  adminRole: string;

  @Column({ nullable: true })
  ticket: string;

  @Column({ nullable: true })
  archive: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
