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
var MediaValidationService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaValidationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
let MediaValidationService = MediaValidationService_1 = class MediaValidationService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(MediaValidationService_1.name);
        this.maxImageDimension = 8000;
        this.maxVideoDuration = 300;
        this.allowedMimes = {
            images: this.configService.get('ALLOWED_IMAGE_MIMES')?.split(',') || [
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/gif',
            ],
            videos: this.configService.get('ALLOWED_VIDEO_MIMES')?.split(',') || [
                'video/mp4',
                'video/quicktime',
                'video/x-matroska',
                'video/webm',
            ],
            documents: this.configService.get('ALLOWED_DOCUMENT_MIMES')?.split(',') || [
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
            audio: this.configService.get('ALLOWED_AUDIO_MIMES')?.split(',') || [
                'audio/mpeg',
                'audio/ogg',
                'audio/wav',
                'audio/webm',
                'audio/mp4',
                'audio/aac',
            ],
        };
        this.sizeLimits = {
            image: this.configService.get('MAX_IMAGE_SIZE') || 16 * 1024 * 1024,
            video: this.configService.get('MAX_VIDEO_SIZE') || 64 * 1024 * 1024,
            document: this.configService.get('MAX_DOCUMENT_SIZE') || 100 * 1024 * 1024,
            audio: this.configService.get('MAX_AUDIO_SIZE') || 16 * 1024 * 1024,
        };
    }
    validateMimeType(mediaType, mimeType) {
        let allowed = [];
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
                throw new common_1.BadRequestException(`Unknown media type: ${mediaType}`);
        }
        if (!allowed.includes(mimeType.toLowerCase())) {
            throw new common_1.BadRequestException(`MIME type ${mimeType} not allowed for ${mediaType}. Allowed: ${allowed.join(', ')}`);
        }
    }
    validateSize(mediaType, sizeBytes) {
        let limit;
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
                throw new common_1.BadRequestException(`Unknown media type: ${mediaType}`);
        }
        if (sizeBytes > limit) {
            throw new common_1.BadRequestException(`File size ${sizeBytes} bytes exceeds limit of ${limit} bytes for ${mediaType}`);
        }
    }
    validateFilename(filename) {
        if (!filename || filename.length > 255) {
            throw new common_1.BadRequestException('Invalid filename');
        }
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            throw new common_1.BadRequestException('Invalid filename');
        }
        if (/[\x00-\x1f\x7f]/.test(filename)) {
            throw new common_1.BadRequestException('Invalid filename');
        }
    }
    validateExtension(mediaType, filename, mimeType) {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const mimeToExt = {
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
        }
    }
    async validateFileContent(buffer, mimeType) {
        const magicBytes = {
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
        if (!signatures)
            return true;
        return signatures.some((sig) => buffer.subarray(0, sig.length).equals(sig));
    }
    sanitizeFilename(filename) {
        const name = filename.split('/').pop()?.split('\\').pop() || 'file';
        return name
            .replace(/[^\w\s.-]/g, '_')
            .replace(/\s+/g, '_')
            .substring(0, 255);
    }
    generateChecksum(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }
    async validateUploadedFile(file, mediaType) {
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
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                return { valid: false, error: error.message };
            }
            return { valid: false, error: 'Validation failed' };
        }
    }
};
exports.MediaValidationService = MediaValidationService;
exports.MediaValidationService = MediaValidationService = MediaValidationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], MediaValidationService);
//# sourceMappingURL=media-validation.service.js.map