import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordModule } from './discord/discord.module.js';
import { TicketModule } from './ticket/ticket.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'better-sqlite3',
        database: configService.get<string>('DATABASE_PATH') || './bot.db',
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    DiscordModule,
    TicketModule,
  ],
})
export class AppModule {}
