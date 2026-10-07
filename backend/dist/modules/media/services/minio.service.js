"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MinioService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinioService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const Minio = require("minio");
const uuid_1 = require("uuid");
let MinioService = MinioService_1 = class MinioService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(MinioService_1.name);
        this.bucket = this.configService.get('S3_BUCKET') || 'wibe-media';
        this.publicUrl = this.configService.get('S3_PUBLIC_URL') || 'http://localhost:9000';
    }
    async onModuleInit() {
        this.client = new Minio.Client({
            endPoint: this.configService.get('S3_ENDPOINT')?.replace('http://', '').replace('https://', '').split(':')[0] || 'localhost',
            port: parseInt(this.configService.get('S3_ENDPOINT')?.split(':')[2] || '9000'),
            useSSL: this.configService.get('S3_ENDPOINT')?.startsWith('https') || false,
            accessKey: this.configService.get('S3_ACCESS_KEY') || 'minioadmin',
            secretKey: this.configService.get('S3_SECRET_KEY') || 'minioadmin',
            region: this.configService.get('S3_REGION') || 'us-east-1',
        });
        await this.ensureBucketExists();
    }
    async ensureBucketExists() {
        const exists = await this.client.bucketExists(this.bucket);
        if (!exists) {
            await this.client.makeBucket(this.bucket, 'us-east-1');
            this.logger.log(`Created bucket: ${this.bucket}`);
        }
    }
    generateStorageKey(userId, mediaType, originalFilename) {
        const ext = originalFilename.split('.').pop()?.toLowerCase() || 'bin';
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const randomId = (0, uuid_1.v4)().split('-')[0];
        return `media/${mediaType.toLowerCase()}/${year}/${month}/${day}/${userId}/${randomId}.${ext}`;
    }
    generateThumbnailKey(storageKey) {
        const parts = storageKey.split('/');
        const filename = parts.pop() || '';
        const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
        return `${parts.join('/')}/thumbnails/${nameWithoutExt}_thumb.jpg`;
    }
    async getPresignedUploadUrl(storageKey, contentType, expiresIn = 3600) {
        return this.client.presignedPutObject(this.bucket, storageKey, expiresIn, {
            'Content-Type': contentType,
        });
    }
    async getPresignedDownloadUrl(storageKey, expiresIn = 3600, responseContentDisposition) {
        const params = {};
        if (responseContentDisposition) {
            params['response-content-disposition'] = responseContentDisposition;
        }
        return this.client.presignedGetObject(this.bucket, storageKey, expiresIn, params);
    }
    async getPresignedUploadUrlForMultipart(storageKey, contentType, partNumber, uploadId, expiresIn = 3600) {
        return this.client.presignedPutObject(this.bucket, storageKey, expiresIn, {
            'Content-Type': contentType,
            partNumber: String(partNumber),
            uploadId,
        });
    }
    async createMultipartUpload(storageKey, contentType) {
        const result = await this.client.createMultipartUpload(this.bucket, storageKey, {
            'Content-Type': contentType,
        });
        return result.uploadId;
    }
    async completeMultipartUpload(storageKey, uploadId, parts) {
        await this.client.completeMultipartUpload(this.bucket, storageKey, uploadId, parts);
    }
    async abortMultipartUpload(storageKey, uploadId) {
        await this.client.abortMultipartUpload(this.bucket, storageKey, uploadId);
    }
    async objectExists(storageKey) {
        try {
            await this.client.statObject(this.bucket, storageKey);
            return true;
        }
        catch {
            return false;
        }
    }
    async getObjectSize(storageKey) {
        const stat = await this.client.statObject(this.bucket, storageKey);
        return stat.size;
    }
    async deleteObject(storageKey) {
        await this.client.removeObject(this.bucket, storageKey);
    }
    async deleteObjects(storageKeys) {
        if (storageKeys.length === 0)
            return;
        await this.client.removeObjects(this.bucket, storageKeys);
    }
    async copyObject(sourceKey, destKey) {
        await this.client.copyObject(this.bucket, destKey, `/${this.bucket}/${sourceKey}`);
    }
    getPublicUrl(storageKey) {
        return `${this.publicUrl}/${this.bucket}/${storageKey}`;
    }
    async listObjects(prefix, recursive = true) {
        const objects = [];
        const stream = this.client.listObjects(this.bucket, prefix, recursive);
        for await (const obj of stream) {
            if (obj.name)
                objects.push(obj.name);
        }
        return objects;
    }
};
exports.MinioService = MinioService;
exports.MinioService = MinioService = MinioService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], MinioService);
//# sourceMappingURL=minio.service.js.map