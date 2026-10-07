import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { MediaController } from './media.controller';
import { MediaService } from './services/media.service';
import { MinioService } from './services/minio.service';
import { MediaValidationService } from './services/media-validation.service';
import { ThumbnailService } from './services/thumbnail.service';
import { OrphanCleanupService } from './services/orphan-cleanup.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [MediaController],
  providers: [
    MediaService,
    MinioService,
    MediaValidationService,
    ThumbnailService,
    OrphanCleanupService,
  ],
  exports: [MediaService, MinioService, MediaValidationService, ThumbnailService],
})
export class MediaModule {}