import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

@Entity('commissions')
export class Commission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  guildId: string;

  @Column()
  requesterId: string;

  @Column()
  requesterTag: string;

  @Column()
  ticketChannelId: string;

  @Column()
  launcherName: string;

  @Column()
  folderName: string;

  @Column()
  minecraftVersion: string;

  @Column({
    type: 'text',
  })
  modLoader: ModLoader;

  @Column()
  loaderVersion: string;

  @Column({ type: 'text', nullable: true })
  additionalNotes: string;

  @Column({
    type: 'text',
    default: CommissionStatus.PENDING,
  })
  status: CommissionStatus;

  @Column({ nullable: true })
  assignedAdminId: string;

  @Column({ nullable: true })
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
