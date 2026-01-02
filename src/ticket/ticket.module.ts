import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commission, GuildConfig } from '../entities/index.js';
import { TicketService } from './ticket.service.js';
import { SetupCommand } from './commands/setup.command.js';
import { TicketButtonHandler } from './handlers/ticket-button.handler.js';
import { TicketModalHandler } from './handlers/ticket-modal.handler.js';

@Module({
  imports: [TypeOrmModule.forFeature([Commission, GuildConfig])],
  providers: [
    TicketService,
    SetupCommand,
    TicketButtonHandler,
    TicketModalHandler,
  ],
  exports: [TicketService],
})
export class TicketModule {}
