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
  @PrimaryColumn()
  guildId: string;

  @OneToMany(() => Commission, (commission) => commission.guildConfig)
  commissions: Commission[];

  @Column({ nullable: true })
  adminRoleId: string;

  @Column({ nullable: true })
  ticketCategoryId: string;

  @Column({ nullable: true })
  archiveCategoryId: string;

  @Column({ nullable: true })
  ticketChannelId: string;

  @Column({ nullable: true })
  ticketMessageId: string;

  @Column({ default: 0 })
  ticketCounter: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
