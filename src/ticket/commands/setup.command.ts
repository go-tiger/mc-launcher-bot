import { Injectable } from '@nestjs/common';
import { Context, Options, SlashCommand } from 'necord';
import type { SlashCommandContext } from 'necord';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { SetupOptionsDto } from './setup-options.dto.js';
import { TicketService } from '../ticket.service.js';

@Injectable()
export class SetupCommand {
  constructor(private readonly ticketService: TicketService) {}

  @SlashCommand({
    name: 'setup',
    description: '티켓 시스템을 설정합니다',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
  })
  async onSetup(
    @Context() [interaction]: SlashCommandContext,
    @Options() options: SetupOptionsDto,
  ) {
    if (!interaction.guild) {
      return interaction.reply({
        content: '이 명령어는 서버에서만 사용할 수 있습니다.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const { admin_role, ticket_category, archive_category } = options;

    // Validate categories
    if (ticket_category.type !== ChannelType.GuildCategory) {
      return interaction.reply({
        content: '티켓 카테고리는 카테고리 채널이어야 합니다.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (archive_category.type !== ChannelType.GuildCategory) {
      return interaction.reply({
        content: '아카이브 카테고리는 카테고리 채널이어야 합니다.',
        flags: MessageFlags.Ephemeral,
      });
    }

    // Save guild config
    await this.ticketService.updateGuildConfig(interaction.guild.id, {
      adminRoleId: admin_role.id,
      ticketCategoryId: ticket_category.id,
      archiveCategoryId: archive_category.id,
      ticketChannelId: interaction.channelId,
    });

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle('🎮 커스텀 런처 의뢰')
      .setDescription(
        '마인크래프트 커스텀 런처 제작을 의뢰하시려면 아래 버튼을 클릭해주세요.\n\n' +
        '📋 **의뢰 절차**\n' +
        '1. 아래 버튼 클릭\n' +
        '2. 의뢰 정보 입력\n' +
        '3. 개인 티켓 채널 생성\n' +
        '4. 관리자와 상담 진행'
      )
      .setColor(0x5865F2)
      .setFooter({ text: '의뢰 정보는 관리자만 확인할 수 있습니다.' });

    // Create button
    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('📩 의뢰하기')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    // Send message
    const channel = interaction.channel as TextChannel;
    const message = await channel.send({
      embeds: [embed],
      components: [row],
    });

    // Save message ID
    await this.ticketService.updateGuildConfig(interaction.guild.id, {
      ticketMessageId: message.id,
    });

    return interaction.reply({
      content: '✅ 티켓 시스템이 설정되었습니다!',
      flags: MessageFlags.Ephemeral,
    });
  }
}
