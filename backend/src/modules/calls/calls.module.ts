import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { CallsController } from './calls.controller';
import { CallsService } from './services/calls.service';
import { CallSignalingGateway } from './gateways/call-signaling.gateway';
import { CallStateService } from './services/call-state.service';
import { CallCleanupService } from './services/call-cleanup.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [CallsController],
  providers: [
    CallsService,
    CallSignalingGateway,
    CallStateService,
    CallCleanupService,
  ],
  exports: [CallsService, CallStateService],
})
export class CallsModule {}