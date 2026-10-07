import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET') || 'wibe-media';
    this.publicUrl = this.configService.get<string>('S3_PUBLIC_URL') || 'http://localhost:9000';
  }

  async onModuleInit() {
    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('S3_ENDPOINT')?.replace('http://', '').replace('https://', '').split(':')[0] || 'localhost',
      port: parseInt(this.configService.get<string>('S3_ENDPOINT')?.split(':')[2] || '9000'),
      useSSL: this.configService.get<string>('S3_ENDPOINT')?.startsWith('https') || false,
      accessKey: this.configService.get<string>('S3_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get<string>('S3_SECRET_KEY') || 'minioadmin',
      region: this.configService.get<string>('S3_REGION') || 'us-east-1',
    });

    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
      this.logger.log(`Created bucket: ${this.bucket}`);
    }
  }

  generateStorageKey(userId: string, mediaType: string, originalFilename: string): string {
    const ext = originalFilename.split('.').pop()?.toLowerCase() || 'bin';
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const randomId = uuidv4().split('-')[0];
    return `media/${mediaType.toLowerCase()}/${year}/${month}/${day}/${userId}/${randomId}.${ext}`;
  }

  generateThumbnailKey(storageKey: string): string {
    const parts = storageKey.split('/');
    const filename = parts.pop() || '';
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    return `${parts.join('/')}/thumbnails/${nameWithoutExt}_thumb.jpg`;
  }

  async getPresignedUploadUrl(
    storageKey: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<string> {
    return this.client.presignedPutObject(this.bucket, storageKey, expiresIn, {
      'Content-Type': contentType,
    });
  }

  async getPresignedDownloadUrl(
    storageKey: string,
    expiresIn = 3600,
    responseContentDisposition?: string,
  ): Promise<string> {
    const params: Record<string, string> = {};
    if (responseContentDisposition) {
      params['response-content-disposition'] = responseContentDisposition;
    }
    return this.client.presignedGetObject(this.bucket, storageKey, expiresIn, params);
  }

  async getPresignedUploadUrlForMultipart(
    storageKey: string,
    contentType: string,
    partNumber: number,
    uploadId: string,
    expiresIn = 3600,
  ): Promise<string> {
    return this.client.presignedPutObject(
      this.bucket,
      storageKey,
      expiresIn,
      {
        'Content-Type': contentType,
        partNumber: String(partNumber),
        uploadId,
      },
    );
  }

  async createMultipartUpload(storageKey: string, contentType: string): Promise<string> {
    const result = await this.client.createMultipartUpload(this.bucket, storageKey, {
      'Content-Type': contentType,
    });
    return result.uploadId;
  }

  async completeMultipartUpload(
    storageKey: string,
    uploadId: string,
    parts: Array<{ partNumber: number; etag: string }>,
  ): Promise<void> {
    await this.client.completeMultipartUpload(this.bucket, storageKey, uploadId, parts);
  }

  async abortMultipartUpload(storageKey: string, uploadId: string): Promise<void> {
    await this.client.abortMultipartUpload(this.bucket, storageKey, uploadId);
  }

  async objectExists(storageKey: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, storageKey);
      return true;
    } catch {
      return false;
    }
  }

  async getObjectSize(storageKey: string): Promise<number> {
    const stat = await this.client.statObject(this.bucket, storageKey);
    return stat.size;
  }

  async deleteObject(storageKey: string): Promise<void> {
    await this.client.removeObject(this.bucket, storageKey);
  }

  async deleteObjects(storageKeys: string[]): Promise<void> {
    if (storageKeys.length === 0) return;
    await this.client.removeObjects(this.bucket, storageKeys);
  }

  async copyObject(sourceKey: string, destKey: string): Promise<void> {
    await this.client.copyObject(
      this.bucket,
      destKey,
      `/${this.bucket}/${sourceKey}`,
    );
  }

  getPublicUrl(storageKey: string): string {
    return `${this.publicUrl}/${this.bucket}/${storageKey}`;
  }

  async listObjects(prefix: string, recursive = true): Promise<string[]> {
    const objects: string[] = [];
    const stream = this.client.listObjects(this.bucket, prefix, recursive);
    for await (const obj of stream) {
      if (obj.name) objects.push(obj.name);
    }
    return objects;
  }
}