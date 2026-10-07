"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const media_controller_1 = require("./media.controller");
const media_service_1 = require("./services/media.service");
const minio_service_1 = require("./services/minio.service");
const media_validation_service_1 = require("./services/media-validation.service");
const thumbnail_service_1 = require("./services/thumbnail.service");
const orphan_cleanup_service_1 = require("./services/orphan-cleanup.service");
let MediaModule = class MediaModule {
};
exports.MediaModule = MediaModule;
exports.MediaModule = MediaModule = __decorate([
    (0, common_1.Module)({
        imports: [schedule_1.ScheduleModule.forRoot()],
        controllers: [media_controller_1.MediaController],
        providers: [
            media_service_1.MediaService,
            minio_service_1.MinioService,
            media_validation_service_1.MediaValidationService,
            thumbnail_service_1.ThumbnailService,
            orphan_cleanup_service_1.OrphanCleanupService,
        ],
        exports: [media_service_1.MediaService, minio_service_1.MinioService, media_validation_service_1.MediaValidationService, thumbnail_service_1.ThumbnailService],
    })
], MediaModule);
//# sourceMappingURL=media.module.js.map