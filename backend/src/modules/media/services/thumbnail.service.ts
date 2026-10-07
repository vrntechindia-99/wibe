import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);

  private readonly imageThumbnailSize = { width: 300, height: 300 };
  private readonly videoThumbnailTime = 1; // seconds

  constructor(private readonly configService: ConfigService) {}

  async generateImageThumbnail(buffer: Buffer, options?: { width?: number; height?: number }): Promise<Buffer> {
    const width = options?.width || this.imageThumbnailSize.width;
    const height = options?.height || this.imageThumbnailSize.height;

    try {
      const thumbnail = await sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      return thumbnail;
    } catch (error) {
      this.logger.error('Failed to generate image thumbnail', error);
      throw error;
    }
  }

  async generateVideoThumbnail(buffer: Buffer): Promise<Buffer> {
    // For video thumbnails, we would typically use ffmpeg
    // This is a placeholder - in production, use fluent-ffmpeg
    this.logger.warn('Video thumbnail generation not fully implemented - requires ffmpeg');
    
    // Return a placeholder or first frame if possible
    // For now, return empty buffer - actual implementation needs ffmpeg
    return Buffer.from('');
  }

  async extractImageMetadata(buffer: Buffer): Promise<{ width: number; height: number; format: string }> {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
      };
    } catch (error) {
      this.logger.error('Failed to extract image metadata', error);
      return { width: 0, height: 0, format: 'unknown' };
    }
  }

  async extractVideoMetadata(buffer: Buffer): Promise<{ width: number; height: number; duration: number; format: string }> {
    // Requires ffmpeg - placeholder
    this.logger.warn('Video metadata extraction not fully implemented - requires ffmpeg');
    return { width: 0, height: 0, duration: 0, format: 'unknown' };
  }

  async compressImage(buffer: Buffer, options?: { quality?: number; maxWidth?: number; maxHeight?: number }): Promise<Buffer> {
    const quality = options?.quality || 85;
    const maxWidth = options?.maxWidth || 1920;
    const maxHeight = options?.maxHeight || 1920;

    try {
      return await sharp(buffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality, progressive: true })
        .toBuffer();
    } catch (error) {
      this.logger.error('Failed to compress image', error);
      throw error;
    }
  }
}