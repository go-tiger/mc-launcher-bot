import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('guild_configs')
export class GuildConfig {
  @PrimaryColumn()
  guildId: string;

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
