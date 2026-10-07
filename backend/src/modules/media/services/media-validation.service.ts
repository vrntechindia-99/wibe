import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface AllowedMimeConfig {
  images: string[];
  videos: string[];
  documents: string[];
  audio: string[];
}

interface SizeLimitsConfig {
  image: number;
  video: number;
  document: number;
  audio: number;
}

@Injectable()
export class MediaValidationService {
  private readonly logger = new Logger(MediaValidationService.name);

  private readonly allowedMimes: AllowedMimeConfig;
  private readonly sizeLimits: SizeLimitsConfig;
  private readonly maxImageDimension = 8000;
  private readonly maxVideoDuration = 300; // 5 minutes

  constructor(private readonly configService: ConfigService) {
    // Load from config or use defaults
    this.allowedMimes = {
      images: this.configService.get<string>('ALLOWED_IMAGE_MIMES')?.split(',') || [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ],
      videos: this.configService.get<string>('ALLOWED_VIDEO_MIMES')?.split(',') || [
        'video/mp4',
        'video/quicktime',
        'video/x-matroska',
        'video/webm',
      ],
      documents: this.configService.get<string>('ALLOWED_DOCUMENT_MIMES')?.split(',') || [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed',
      ],
      audio: this.configService.get<string>('ALLOWED_AUDIO_MIMES')?.split(',') || [
        'audio/mpeg',
        'audio/ogg',
        'audio/wav',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
      ],
    };

    this.sizeLimits = {
      image: this.configService.get<number>('MAX_IMAGE_SIZE') || 16 * 1024 * 1024, // 16MB
      video: this.configService.get<number>('MAX_VIDEO_SIZE') || 64 * 1024 * 1024, // 64MB
      document: this.configService.get<number>('MAX_DOCUMENT_SIZE') || 100 * 1024 * 1024, // 100MB
      audio: this.configService.get<number>('MAX_AUDIO_SIZE') || 16 * 1024 * 1024, // 16MB
    };
  }

  validateMimeType(mediaType: string, mimeType: string): void {
    let allowed: string[] = [];
    switch (mediaType) {
      case 'IMAGE':
        allowed = this.allowedMimes.images;
        break;
      case 'VIDEO':
        allowed = this.allowedMimes.videos;
        break;
      case 'DOCUMENT':
        allowed = this.allowedMimes.documents;
        break;
      case 'AUDIO':
        allowed = this.allowedMimes.audio;
        break;
      default:
        throw new BadRequestException(`Unknown media type: ${mediaType}`);
    }

    if (!allowed.includes(mimeType.toLowerCase())) {
      throw new BadRequestException(
        `MIME type ${mimeType} not allowed for ${mediaType}. Allowed: ${allowed.join(', ')}`,
      );
    }
  }

  validateSize(mediaType: string, sizeBytes: number): void {
    let limit: number;
    switch (mediaType) {
      case 'IMAGE':
        limit = this.sizeLimits.image;
        break;
      case 'VIDEO':
        limit = this.sizeLimits.video;
        break;
      case 'DOCUMENT':
        limit = this.sizeLimits.document;
        break;
      case 'AUDIO':
        limit = this.sizeLimits.audio;
        break;
      default:
        throw new BadRequestException(`Unknown media type: ${mediaType}`);
    }

    if (sizeBytes > limit) {
      throw new BadRequestException(
        `File size ${sizeBytes} bytes exceeds limit of ${limit} bytes for ${mediaType}`,
      );
    }
  }

  validateFilename(filename: string): void {
    if (!filename || filename.length > 255) {
      throw new BadRequestException('Invalid filename');
    }

    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Invalid filename');
    }

    // Check for control characters
    if (/[\x00-\x1f\x7f]/.test(filename)) {
      throw new BadRequestException('Invalid filename');
    }
  }

  validateExtension(mediaType: string, filename: string, mimeType: string): void {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeToExt: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif'],
      'video/mp4': ['mp4'],
      'video/quicktime': ['mov'],
      'video/x-matroska': ['mkv'],
      'video/webm': ['webm'],
      'application/pdf': ['pdf'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
      'application/vnd.ms-excel': ['xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
      'application/vnd.ms-powerpoint': ['ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
      'text/plain': ['txt'],
      'application/zip': ['zip'],
      'audio/mpeg': ['mp3'],
      'audio/ogg': ['ogg'],
      'audio/wav': ['wav'],
      'audio/webm': ['webm'],
      'audio/mp4': ['m4a'],
      'audio/aac': ['aac'],
    };

    const allowedExts = mimeToExt[mimeType.toLowerCase()];
    if (allowedExts && !allowedExts.includes(ext)) {
      this.logger.warn(`Extension mismatch: ${ext} for MIME ${mimeType}`);
      // Warning only, don't block
    }
  }

  async validateFileContent(buffer: Buffer, mimeType: string): Promise<boolean> {
    // Magic bytes validation
    const magicBytes: Record<string, Buffer[]> = {
      'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
      'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
      'image/webp': [Buffer.from('RIFF'), Buffer.from('WEBP', 8)],
      'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
      'video/mp4': [Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70])],
      'application/pdf': [Buffer.from('%PDF')],
      'audio/mpeg': [Buffer.from([0xFF, 0xFB]), Buffer.from('ID3')],
      'audio/ogg': [Buffer.from('OggS')],
      'audio/wav': [Buffer.from('RIFF'), Buffer.from('WAVE', 8)],
    };

    const signatures = magicBytes[mimeType.toLowerCase()];
    if (!signatures) return true; // Unknown type, skip magic bytes check

    return signatures.some((sig) => buffer.subarray(0, sig.length).equals(sig));
  }

  sanitizeFilename(filename: string): string {
    // Remove path components
    const name = filename.split('/').pop()?.split('\\').pop() || 'file';
    // Replace special characters
    return name
      .replace(/[^\w\s.-]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255);
  }

  generateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async validateUploadedFile(
    file: Express.Multer.File,
    mediaType: string,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      this.validateMimeType(mediaType, file.mimetype);
      this.validateSize(mediaType, file.size);
      this.validateFilename(file.originalname);
      this.validateExtension(mediaType, file.originalname, file.mimetype);

      const contentValid = await this.validateFileContent(file.buffer, file.mimetype);
      if (!contentValid) {
        return { valid: false, error: 'File content does not match declared type' };
      }

      return { valid: true };
    } catch (error) {
      if (error instanceof BadRequestException) {
        return { valid: false, error: error.message };
      }
      return { valid: false, error: 'Validation failed' };
    }
  }
}