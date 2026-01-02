import { Injectable } from '@nestjs/common';
import { Context, SlashCommand } from 'necord';
import type { SlashCommandContext } from 'necord';

@Injectable()
export class PingCommand {
  @SlashCommand({
    name: 'ping',
    description: '봇 응답 테스트',
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    const latency = Date.now() - interaction.createdTimestamp;
    return interaction.reply({
      content: `🏓 Pong! Latency: ${latency}ms`,
      ephemeral: true,
    });
  }
}
