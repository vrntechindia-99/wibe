import { Module } from '@nestjs/common';

import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './services/reactions.service';

@Module({
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}