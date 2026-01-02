import { Injectable } from '@nestjs/common';
import { Button, Context, StringSelect } from 'necord';
import type { ButtonContext, StringSelectContext } from 'necord';
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import {
  getMinecraftVersions,
  getForgeVersions,
  getFabricVersions,
  getNeoForgeVersions,
} from '@gotiger/minecraft-modloader-api';
import { TicketService, UserSelection } from '../ticket.service.js';

@Injectable()
export class TicketButtonHandler {
  constructor(private readonly ticketService: TicketService) {}

  @Button('create_ticket')
  async onCreateTicket(@Context() [interaction]: ButtonContext) {
    // Fetch Minecraft versions from API
    const versions = await getMinecraftVersions();
    const releaseVersions = versions
      .filter(v => v.type === 'release')
      .slice(0, 25) // Discord limit
      .map(v => ({
        label: v.id,
        value: v.id,
      }));

    // Clear previous selection
    this.ticketService.setUserSelection(interaction.user.id, {});

    // MC Version Select Menu
    const mcVersionSelect = new StringSelectMenuBuilder()
      .setCustomId('select_mc_version')
      .setPlaceholder('1️⃣ 마인크래프트 버전 선택')
      .addOptions(releaseVersions);

    // Mod Loader Select Menu
    const modLoaderSelect = new StringSelectMenuBuilder()
      .setCustomId('select_mod_loader')
      .setPlaceholder('2️⃣ 모드로더 선택')
      .setDisabled(true)
      .addOptions([
        { label: 'Forge', value: 'Forge' },
        { label: 'Fabric', value: 'Fabric' },
        { label: 'NeoForge', value: 'NeoForge' },
      ]);

    // Next Button (disabled until all selections made)
    const nextButton = new ButtonBuilder()
      .setCustomId('ticket_next')
      .setLabel('다음')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    await interaction.reply({
      content: '**의뢰 정보를 선택해주세요**\n\n순서대로 선택해주세요.',
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(mcVersionSelect),
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(modLoaderSelect),
        new ActionRowBuilder<ButtonBuilder>().addComponents(nextButton),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  @StringSelect('select_mc_version')
  async onSelectMcVersion(@Context() [interaction]: StringSelectContext) {
    const selected = interaction.values[0];
    // Reset mod loader and loader version when MC version changes
    const userData = this.ticketService.updateUserSelection(interaction.user.id, {
      mcVersion: selected,
      modLoader: undefined,
      loaderVersion: undefined,
    });
    await this.updateSelectionMessage(interaction, userData);
  }

  @StringSelect('select_mod_loader')
  async onSelectModLoader(@Context() [interaction]: StringSelectContext) {
    const selected = interaction.values[0];
    // Reset loader version when mod loader changes
    const userData = this.ticketService.updateUserSelection(interaction.user.id, {
      modLoader: selected,
      loaderVersion: undefined,
    });
    await this.updateSelectionMessage(interaction, userData);
  }

  @StringSelect('select_loader_version')
  async onSelectLoaderVersion(@Context() [interaction]: StringSelectContext) {
    const selected = interaction.values[0];
    const userData = this.ticketService.updateUserSelection(interaction.user.id, {
      loaderVersion: selected,
    });
    await this.updateSelectionMessage(interaction, userData);
  }

  private async updateSelectionMessage(interaction: any, userData: UserSelection) {
    const allSelected = userData.mcVersion && userData.modLoader && userData.loaderVersion;

    // Rebuild MC version select
    const versions = await getMinecraftVersions();
    const releaseVersions = versions
      .filter(v => v.type === 'release')
      .slice(0, 25)
      .map(v => ({
        label: v.id,
        value: v.id,
        default: v.id === userData.mcVersion,
      }));

    const mcVersionSelect = new StringSelectMenuBuilder()
      .setCustomId('select_mc_version')
      .setPlaceholder('1️⃣ 마인크래프트 버전 선택')
      .addOptions(releaseVersions);

    // Rebuild mod loader select
    const modLoaderSelect = new StringSelectMenuBuilder()
      .setCustomId('select_mod_loader')
      .setPlaceholder('2️⃣ 모드로더 선택')
      .setDisabled(!userData.mcVersion)
      .addOptions([
        { label: 'Forge', value: 'Forge', default: userData.modLoader === 'Forge' },
        { label: 'Fabric', value: 'Fabric', default: userData.modLoader === 'Fabric' },
        { label: 'NeoForge', value: 'NeoForge', default: userData.modLoader === 'NeoForge' },
      ]);

    const components: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] = [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(mcVersionSelect),
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(modLoaderSelect),
    ];

    // Add loader version select if MC version and mod loader are selected
    if (userData.mcVersion && userData.modLoader) {
      const loaderVersions = await this.getLoaderVersions(userData.mcVersion, userData.modLoader);

      if (loaderVersions.length > 0) {
        const loaderVersionSelect = new StringSelectMenuBuilder()
          .setCustomId('select_loader_version')
          .setPlaceholder('3️⃣ 로더 버전 선택')
          .addOptions(
            loaderVersions.slice(0, 25).map(v => ({
              label: v,
              value: v,
              default: v === userData.loaderVersion,
            }))
          );

        components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(loaderVersionSelect));
      }
    }

    // Add next button
    const nextButton = new ButtonBuilder()
      .setCustomId('ticket_next')
      .setLabel('다음')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!allSelected);

    components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(nextButton));

    const statusText = `**의뢰 정보를 선택해주세요**\n\n` +
      `1️⃣ 마인크래프트 버전: ${userData.mcVersion || '선택 안됨'}\n` +
      `2️⃣ 모드로더: ${userData.modLoader || '선택 안됨'}\n` +
      `3️⃣ 로더 버전: ${userData.loaderVersion || '선택 안됨'}`;

    await interaction.update({
      content: statusText,
      components,
    });
  }

  private async getLoaderVersions(mcVersion: string, modLoader: string): Promise<string[]> {
    try {
      switch (modLoader) {
        case 'Forge': {
          const forgeVersions = await getForgeVersions(mcVersion);
          return forgeVersions.map(v => v.version);
        }
        case 'Fabric': {
          const fabricVersions = await getFabricVersions(mcVersion);
          return fabricVersions.map(v => v.version);
        }
        case 'NeoForge': {
          const neoforgeVersions = await getNeoForgeVersions(mcVersion);
          return neoforgeVersions.map(v => v.version);
        }
        default:
          return [];
      }
    } catch {
      return [];
    }
  }

  @Button('ticket_next')
  async onTicketNext(@Context() [interaction]: ButtonContext) {
    const userData = this.ticketService.getUserSelection(interaction.user.id);

    if (!userData?.mcVersion || !userData?.modLoader || !userData?.loaderVersion) {
      return interaction.reply({
        content: '모든 항목을 선택해주세요.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('ticket_modal')
      .setTitle('커스텀 런처 의뢰');

    const launcherNameInput = new TextInputBuilder()
      .setCustomId('launcher_name')
      .setLabel('런처 이름')
      .setPlaceholder('예: MyLauncher')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(50);

    const folderNameInput = new TextInputBuilder()
      .setCustomId('folder_name')
      .setLabel('폴더명')
      .setPlaceholder('예: .mylauncher')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(50);

    const additionalNotesInput = new TextInputBuilder()
      .setCustomId('additional_notes')
      .setLabel('추가 요청사항 (선택)')
      .setPlaceholder('런처에 포함할 파일, 특별 요청 등')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(launcherNameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(folderNameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(additionalNotesInput),
    );

    await interaction.showModal(modal);
  }
}
