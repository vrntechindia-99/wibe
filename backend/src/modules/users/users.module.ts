import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ProfileService } from './services/profile.service';
import { PrivacyService } from './services/privacy.service';
import { BlockService } from './services/block.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, ProfileService, PrivacyService, BlockService],
  exports: [UsersService, ProfileService, PrivacyService, BlockService],
})
export class UsersModule {}