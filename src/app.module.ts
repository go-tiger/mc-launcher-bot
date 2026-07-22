import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
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
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST') || 'localhost',
        port: configService.get<number>('DATABASE_PORT') || 5432,
        username: configService.get<string>('DATABASE_USERNAME') || 'postgres',
        password: configService.get<string>('DATABASE_PASSWORD') || '',
        database: configService.get<string>('DATABASE_DATABASE') || 'gt_studio_bot',
        namingStrategy: new SnakeNamingStrategy(),
        entities: [__dirname + '/core/entities/**/*{.ts,.js}'],
        synchronize: true,
      }),
    }),
    DiscordModule,
    TicketModule,
  ],
})
export class AppModule {}
