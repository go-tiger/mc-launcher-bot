import { Injectable } from '@nestjs/common';
import { Button, Context, Modal, StringSelect } from 'necord';
import type { ButtonContext, ModalContext, StringSelectContext } from 'necord';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { TicketService } from '../ticket.service.js';
import { CommissionStatus } from '../../core/entities/index.js';

@Injectable()
export class CommissionActionHandler {
  constructor(private readonly ticketService: TicketService) {}

  @Button('commission_status')
  async onStatusButton(@Context() [interaction]: ButtonContext) {
    // Check if user has admin role
    const config = await this.ticketService.getOrCreateGuildConfig(interaction.guildId!);
    if (!interaction.member || !('roles' in interaction.member)) {
      return interaction.reply({
        content: '권한이 없습니다.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const memberRoles = interaction.member.roles;
    const hasAdminRole = Array.isArray(memberRoles)
      ? memberRoles.includes(config.adminRoleId)
      : memberRoles.cache.has(config.adminRoleId);

    if (!hasAdminRole) {
      return interaction.reply({
        content: '관리자만 상태를 변경할 수 있습니다.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const statusSelect = new StringSelectMenuBuilder()
      .setCustomId('select_commission_status')
      .setPlaceholder('새로운 상태 선택')
      .addOptions(
        Object.values(CommissionStatus).map(status => ({
          label: status,
          value: status,
        }))
      );

    await interaction.reply({
      content: '변경할 상태를 선택해주세요:',
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(statusSelect),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  @StringSelect('select_commission_status')
  async onSelectStatus(@Context() [interaction]: StringSelectContext) {
    const newStatus = interaction.values[0] as CommissionStatus;
    const commission = await this.ticketService.getCommissionByChannelId(interaction.channelId!);

    if (!commission) {
      return interaction.reply({
        content: '의뢰 정보를 찾을 수 없습니다.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await this.ticketService.updateCommissionStatus(commission.id, newStatus);

    // Update the original embed
    await this.updateCommissionEmbed(interaction, commission.id);

    // Ephemeral response to admin
    await interaction.reply({
      content: `✅ 상태가 **${newStatus}**(으)로 변경되었습니다.`,
      flags: MessageFlags.Ephemeral,
    });

    // Public notification to requester
    if (interaction.channel && 'send' in interaction.channel) {
      await interaction.channel.send({
        content: `<@${commission.requesterId}> 의뢰 상태가 **${newStatus}**(으)로 변경되었습니다.`,
      });
    }

    // Move to archive category if status is COMPLETED
    if (newStatus === CommissionStatus.COMPLETED && interaction.guildId) {
      const config = await this.ticketService.getOrCreateGuildConfig(interaction.guildId);
      if (config.archiveCategoryId && interaction.channel && 'setParent' in interaction.channel) {
        // lockPermissions: false to keep existing permissions (requester can still chat)
        await interaction.channel.setParent(config.archiveCategoryId, { lockPermissions: false }).catch(() => {});
      }
    }
  }

  @Button('commission_price')
  async onPriceButton(@Context() [interaction]: ButtonContext) {
    // Check if user has admin role
    const config = await this.ticketService.getOrCreateGuildConfig(interaction.guildId!);
    if (!interaction.member || !('roles' in interaction.member)) {
      return interaction.reply({
        content: '권한이 없습니다.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const memberRoles = interaction.member.roles;
    const hasAdminRole = Array.isArray(memberRoles)
      ? memberRoles.includes(config.adminRoleId)
      : memberRoles.cache.has(config.adminRoleId);

    if (!hasAdminRole) {
      return interaction.reply({
        content: '관리자만 가격을 설정할 수 있습니다.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('commission_price_modal')
      .setTitle('가격 설정');

    const priceInput = new TextInputBuilder()
      .setCustomId('price_input')
      .setLabel('가격 (원)')
      .setPlaceholder('예: 10000')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(10);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(priceInput)
    );

    await interaction.showModal(modal);
  }

  @Modal('commission_price_modal')
  async onPriceModal(@Context() [interaction]: ModalContext) {
    const priceStr = interaction.fields.getTextInputValue('price_input');
    const price = parseInt(priceStr, 10);

    if (isNaN(price) || price < 0) {
      return interaction.reply({
        content: '올바른 가격을 입력해주세요.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const commission = await this.ticketService.getCommissionByChannelId(interaction.channelId!);

    if (!commission) {
      return interaction.reply({
        content: '의뢰 정보를 찾을 수 없습니다.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await this.ticketService.updateCommissionPrice(commission.id, price);

    // Update the original embed
    await this.updateCommissionEmbed(interaction, commission.id);

    // Ephemeral response to admin
    await interaction.reply({
      content: `✅ 가격이 **${price.toLocaleString()}원**으로 설정되었습니다.`,
      flags: MessageFlags.Ephemeral,
    });

    // Public notification to requester
    if (interaction.channel && 'send' in interaction.channel) {
      await interaction.channel.send({
        content: `<@${commission.requesterId}> 의뢰 가격이 **${price.toLocaleString()}원**으로 설정되었습니다.`,
      });
    }
  }

  @Button('commission_close')
  async onCloseButton(@Context() [interaction]: ButtonContext) {
    // Check if user has admin role
    const config = await this.ticketService.getOrCreateGuildConfig(interaction.guildId!);
    if (!interaction.member || !('roles' in interaction.member)) {
      return interaction.reply({
        content: '권한이 없습니다.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const memberRoles = interaction.member.roles;
    const hasAdminRole = Array.isArray(memberRoles)
      ? memberRoles.includes(config.adminRoleId)
      : memberRoles.cache.has(config.adminRoleId);

    if (!hasAdminRole) {
      return interaction.reply({
        content: '관리자만 티켓을 닫을 수 있습니다.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('commission_close_confirm')
        .setLabel('확인')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('commission_close_cancel')
        .setLabel('취소')
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      content: '⚠️ 정말로 이 티켓을 닫으시겠습니까? 채널이 삭제됩니다.',
      components: [confirmRow],
      flags: MessageFlags.Ephemeral,
    });
  }

  @Button('commission_close_confirm')
  async onCloseConfirm(@Context() [interaction]: ButtonContext) {
    const commission = await this.ticketService.getCommissionByChannelId(interaction.channelId!);

    if (commission) {
      await this.ticketService.updateCommissionStatus(commission.id, CommissionStatus.COMPLETED);
    }

    await interaction.reply({
      content: '🔒 티켓을 닫는 중...',
      flags: MessageFlags.Ephemeral,
    });

    // Delete the channel after a short delay
    setTimeout(async () => {
      try {
        await interaction.channel?.delete();
      } catch (error) {
        console.error('Failed to delete channel:', error);
      }
    }, 2000);
  }

  @Button('commission_close_cancel')
  async onCloseCancel(@Context() [interaction]: ButtonContext) {
    await interaction.update({
      content: '티켓 닫기가 취소되었습니다.',
      components: [],
    });
  }

  private async updateCommissionEmbed(interaction: any, commissionId: number) {
    const commission = await this.ticketService.getCommissionById(commissionId);
    if (!commission) return;

    // Find and update the original message with the embed
    const channel = interaction.channel;
    if (!channel || !('messages' in channel)) return;

    const messages = await channel.messages.fetch({ limit: 50 });
    const botMessage = messages.find(
      (m: any) => m.author.id === interaction.client.user?.id && m.embeds.length > 0
    );

    if (!botMessage) return;

    const embed = new EmbedBuilder()
      .setTitle('📋 의뢰 정보')
      .setColor(0x5865F2)
      .addFields(
        { name: '의뢰자', value: `<@${commission.requesterId}>`, inline: true },
        { name: '상태', value: commission.status, inline: true },
        { name: '가격', value: commission.price ? `${commission.price.toLocaleString()}원` : '미정', inline: true },
        { name: '런처 이름', value: commission.launcherName, inline: true },
        { name: '폴더명', value: commission.folderName, inline: true },
        { name: '마인크래프트 버전', value: commission.minecraftVersion, inline: true },
        { name: '모드로더', value: `${commission.modLoader} ${commission.loaderVersion}`, inline: true },
      )
      .setTimestamp();

    if (commission.additionalNotes) {
      embed.addFields({ name: '추가 요청사항', value: commission.additionalNotes });
    }

    await botMessage.edit({ embeds: [embed] });
  }
}
