import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { StatusController } from './status.controller';
import { StatusService } from './services/status.service';
import { StatusPrivacyService } from './services/status-privacy.service';
import { StatusCleanupService } from './services/status-cleanup.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [StatusController],
  providers: [StatusService, StatusPrivacyService, StatusCleanupService],
  exports: [StatusService, StatusPrivacyService],
})
export class StatusModule {}