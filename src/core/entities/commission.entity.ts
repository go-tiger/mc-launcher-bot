import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GuildConfig } from './guild-config.entity.js';

export enum CommissionStatus {
  PENDING = '대기',
  ACCEPTED = '수락',
  IN_PROGRESS = '진행',
  PAYMENT_PENDING = '결제대기',
  REVIEW = '검토',
  COMPLETED = '완료',
}

export enum ModLoader {
  FORGE = 'Forge',
  FABRIC = 'Fabric',
  NEOFORGE = 'NeoForge',
}

@Entity('bot_commissions')
export class Commission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'guildId' })
  guildId: string;

  @ManyToOne(() => GuildConfig, (guildConfig) => guildConfig.commissions)
  @JoinColumn({ name: 'guildId', referencedColumnName: 'guildId' })
  guildConfig: GuildConfig;

  @Column({ name: 'requesterId' })
  requesterId: string;

  @Column({ name: 'requesterTag' })
  requesterTag: string;

  @Column({ name: 'ticketChannelId' })
  ticketChannelId: string;

  @Column({ name: 'launcherName' })
  launcherName: string;

  @Column({ name: 'folderName' })
  folderName: string;

  @Column({ name: 'minecraftVersion' })
  minecraftVersion: string;

  @Column({
    name: 'modLoader',
    type: 'text',
  })
  modLoader: ModLoader;

  @Column({ name: 'loaderVersion' })
  loaderVersion: string;

  @Column({ name: 'additionalNotes', type: 'text', nullable: true })
  additionalNotes: string;

  @Column({
    name: 'status',
    type: 'text',
    default: CommissionStatus.PENDING,
  })
  status: CommissionStatus;

  @Column({ name: 'assignedAdminId', nullable: true })
  assignedAdminId: string;

  @Column({ name: 'price', nullable: true })
  price: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
