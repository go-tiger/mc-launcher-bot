import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission, GuildConfig, ModLoader, CommissionStatus } from '../entities/index.js';

export interface UserSelection {
  mcVersion?: string;
  modLoader?: string;
  loaderVersion?: string;
  interactionToken?: string;
  applicationId?: string;
}

@Injectable()
export class TicketService {
  private userSelections = new Map<string, UserSelection>();

  constructor(
    @InjectRepository(Commission)
    private commissionRepository: Repository<Commission>,
    @InjectRepository(GuildConfig)
    private guildConfigRepository: Repository<GuildConfig>,
  ) {}

  // User selection methods
  setUserSelection(userId: string, data: UserSelection): void {
    this.userSelections.set(userId, data);
  }

  getUserSelection(userId: string): UserSelection | undefined {
    return this.userSelections.get(userId);
  }

  updateUserSelection(userId: string, data: Partial<UserSelection>): UserSelection {
    const existing = this.userSelections.get(userId) || {};
    const updated = { ...existing, ...data };
    this.userSelections.set(userId, updated);
    return updated;
  }

  clearUserSelection(userId: string): void {
    this.userSelections.delete(userId);
  }

  async getOrCreateGuildConfig(guildId: string): Promise<GuildConfig> {
    let config = await this.guildConfigRepository.findOne({ where: { guildId } });
    if (!config) {
      config = this.guildConfigRepository.create({ guildId });
      await this.guildConfigRepository.save(config);
    }
    return config;
  }

  async updateGuildConfig(guildId: string, data: Partial<GuildConfig>): Promise<GuildConfig> {
    const config = await this.getOrCreateGuildConfig(guildId);
    Object.assign(config, data);
    return this.guildConfigRepository.save(config);
  }

  async getNextTicketNumber(guildId: string): Promise<number> {
    const config = await this.getOrCreateGuildConfig(guildId);
    config.ticketCounter += 1;
    await this.guildConfigRepository.save(config);
    return config.ticketCounter;
  }

  async createCommission(data: {
    guildId: string;
    requesterId: string;
    requesterTag: string;
    ticketChannelId: string;
    launcherName: string;
    folderName: string;
    minecraftVersion: string;
    modLoader: ModLoader;
    loaderVersion: string;
    additionalNotes?: string;
  }): Promise<Commission> {
    const commission = this.commissionRepository.create({
      ...data,
      status: CommissionStatus.PENDING,
    });
    return this.commissionRepository.save(commission);
  }

  async getCommissionByChannelId(channelId: string): Promise<Commission | null> {
    return this.commissionRepository.findOne({ where: { ticketChannelId: channelId } });
  }

  async updateCommissionStatus(id: number, status: CommissionStatus): Promise<Commission | null> {
    const commission = await this.commissionRepository.findOne({ where: { id } });
    if (!commission) return null;
    commission.status = status;
    return this.commissionRepository.save(commission);
  }

  async updateCommissionPrice(id: number, price: number): Promise<Commission | null> {
    const commission = await this.commissionRepository.findOne({ where: { id } });
    if (!commission) return null;
    commission.price = price;
    return this.commissionRepository.save(commission);
  }

  async getCommissionById(id: number): Promise<Commission | null> {
    return this.commissionRepository.findOne({ where: { id } });
  }
}
