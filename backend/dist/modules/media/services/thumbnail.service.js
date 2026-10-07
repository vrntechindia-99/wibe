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
var ThumbnailService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThumbnailService = void 0;
const common_1 = require("@nestjs/common");
const sharp = require("sharp");
const config_1 = require("@nestjs/config");
let ThumbnailService = ThumbnailService_1 = class ThumbnailService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ThumbnailService_1.name);
        this.imageThumbnailSize = { width: 300, height: 300 };
        this.videoThumbnailTime = 1;
    }
    async generateImageThumbnail(buffer, options) {
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
        }
        catch (error) {
            this.logger.error('Failed to generate image thumbnail', error);
            throw error;
        }
    }
    async generateVideoThumbnail(buffer) {
        this.logger.warn('Video thumbnail generation not fully implemented - requires ffmpeg');
        return Buffer.from('');
    }
    async extractImageMetadata(buffer) {
        try {
            const metadata = await sharp(buffer).metadata();
            return {
                width: metadata.width || 0,
                height: metadata.height || 0,
                format: metadata.format || 'unknown',
            };
        }
        catch (error) {
            this.logger.error('Failed to extract image metadata', error);
            return { width: 0, height: 0, format: 'unknown' };
        }
    }
    async extractVideoMetadata(buffer) {
        this.logger.warn('Video metadata extraction not fully implemented - requires ffmpeg');
        return { width: 0, height: 0, duration: 0, format: 'unknown' };
    }
    async compressImage(buffer, options) {
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
        }
        catch (error) {
            this.logger.error('Failed to compress image', error);
            throw error;
        }
    }
};
exports.ThumbnailService = ThumbnailService;
exports.ThumbnailService = ThumbnailService = ThumbnailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], ThumbnailService);
//# sourceMappingURL=thumbnail.service.js.map