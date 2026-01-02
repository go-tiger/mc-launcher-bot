import { Injectable } from '@nestjs/common';
import { Context, Modal } from 'necord';
import type { ModalContext } from 'necord';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import { TicketService } from '../ticket.service.js';
import { ModLoader, CommissionStatus } from '../../entities/index.js';

@Injectable()
export class TicketModalHandler {
  constructor(private readonly ticketService: TicketService) {}

  @Modal('ticket_modal')
  async onTicketModal(@Context() [interaction]: ModalContext) {
    if (!interaction.guild) {
      return interaction.reply({
        content: '오류가 발생했습니다.',
        flags: MessageFlags.Ephemeral,
      });
    }

    // Get stored selection from service
    const userData = this.ticketService.getUserSelection(interaction.user.id);

    if (!userData?.mcVersion || !userData?.modLoader || !userData?.loaderVersion) {
      return interaction.reply({
        content: '오류가 발생했습니다. 다시 시도해주세요.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const mcVersion = userData.mcVersion;
    const modLoader = userData.modLoader as ModLoader;
    const loaderVersion = userData.loaderVersion;
    const interactionToken = userData.interactionToken;
    const applicationId = userData.applicationId;

    const launcherName = interaction.fields.getTextInputValue('launcher_name');
    const folderName = interaction.fields.getTextInputValue('folder_name');
    const additionalNotes = interaction.fields.getTextInputValue('additional_notes');

    // Clear user selection
    this.ticketService.clearUserSelection(interaction.user.id);

    // Delete the selection message
    if (interactionToken && applicationId) {
      interaction.client.rest
        .delete(`/webhooks/${applicationId}/${interactionToken}/messages/@original`)
        .catch(() => {});
    }

    // Get guild config
    const config = await this.ticketService.getOrCreateGuildConfig(interaction.guild.id);

    if (!config.ticketCategoryId || !config.adminRoleId) {
      return interaction.reply({
        content: '티켓 시스템이 설정되지 않았습니다. 관리자에게 문의해주세요.',
        flags: MessageFlags.Ephemeral,
      });
    }

    // Get next ticket number
    const ticketNumber = await this.ticketService.getNextTicketNumber(interaction.guild.id);
    const ticketName = `ticket-${interaction.user.username}-${String(ticketNumber).padStart(3, '0')}`;

    // Create ticket channel
    const ticketChannel = await interaction.guild.channels.create({
      name: ticketName,
      type: ChannelType.GuildText,
      parent: config.ticketCategoryId,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        {
          id: config.adminRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ManageMessages,
          ],
        },
      ],
    });

    // Save commission to database
    await this.ticketService.createCommission({
      guildId: interaction.guild.id,
      requesterId: interaction.user.id,
      requesterTag: interaction.user.tag,
      ticketChannelId: ticketChannel.id,
      launcherName,
      folderName,
      minecraftVersion: mcVersion,
      modLoader,
      loaderVersion,
      additionalNotes: additionalNotes || undefined,
    });

    // Create info embed
    const embed = new EmbedBuilder()
      .setTitle('📋 의뢰 정보')
      .setColor(0x5865F2)
      .addFields(
        { name: '의뢰자', value: `<@${interaction.user.id}>`, inline: true },
        { name: '상태', value: CommissionStatus.PENDING, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: '런처 이름', value: launcherName, inline: true },
        { name: '폴더명', value: folderName, inline: true },
        { name: '마인크래프트 버전', value: mcVersion, inline: true },
        { name: '모드로더', value: `${modLoader} ${loaderVersion}`, inline: true },
      )
      .setTimestamp();

    if (additionalNotes) {
      embed.addFields({ name: '추가 요청사항', value: additionalNotes });
    }

    // Admin action buttons
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('commission_status')
        .setLabel('상태 변경')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📋'),
      new ButtonBuilder()
        .setCustomId('commission_price')
        .setLabel('가격 설정')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💰'),
      new ButtonBuilder()
        .setCustomId('commission_close')
        .setLabel('티켓 닫기')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒'),
    );

    // Send welcome message in ticket channel
    await ticketChannel.send({
      content: `<@${interaction.user.id}> <@&${config.adminRoleId}>`,
      embeds: [embed],
      components: [actionRow],
    });

    // Reply and delete after 3 seconds
    await interaction.reply({
      content: `✅ 티켓이 생성되었습니다! <#${ticketChannel.id}>`,
      flags: MessageFlags.Ephemeral,
    });

    setTimeout(() => {
      interaction.deleteReply().catch(() => {});
    }, 3000);
  }
}
