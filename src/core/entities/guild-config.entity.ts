import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Commission } from './commission.entity.js';

@Entity('bot_guild_configs')
export class GuildConfig {
  @PrimaryColumn({ name: 'guildId' })
  guildId: string;

  @OneToMany(() => Commission, (commission) => commission.guildConfig)
  commissions: Commission[];

  @Column({ name: 'adminRoleId', nullable: true })
  adminRoleId: string;

  @Column({ name: 'ticketCategoryId', nullable: true })
  ticketCategoryId: string;

  @Column({ name: 'archiveCategoryId', nullable: true })
  archiveCategoryId: string;

  @Column({ name: 'ticketChannelId', nullable: true })
  ticketChannelId: string;

  @Column({ name: 'ticketMessageId', nullable: true })
  ticketMessageId: string;

  @Column({ name: 'ticketCounter', default: 0 })
  ticketCounter: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
