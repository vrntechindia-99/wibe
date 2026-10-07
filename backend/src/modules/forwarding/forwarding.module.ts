import { Module } from '@nestjs/common';

import { ForwardingController } from './forwarding.controller';
import { ForwardingService } from './services/forwarding.service';

@Module({
  controllers: [ForwardingController],
  providers: [ForwardingService],
  exports: [ForwardingService],
})
export class ForwardingModule {}