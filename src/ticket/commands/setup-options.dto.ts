import { ChannelOption, RoleOption } from 'necord';
import type { CategoryChannel, Role } from 'discord.js';

export class SetupOptionsDto {
  @RoleOption({
    name: 'admin_role',
    description: '관리자 역할',
    required: true,
  })
  admin_role: Role;

  @ChannelOption({
    name: 'ticket_category',
    description: '티켓 채널이 생성될 카테고리',
    required: true,
  })
  ticket_category: CategoryChannel;

  @ChannelOption({
    name: 'archive_category',
    description: '완료된 티켓이 이동할 카테고리',
    required: true,
  })
  archive_category: CategoryChannel;
}
