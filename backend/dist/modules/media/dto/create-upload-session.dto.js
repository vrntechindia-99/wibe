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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUploadSessionDto = exports.MediaType = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "IMAGE";
    MediaType["VIDEO"] = "VIDEO";
    MediaType["DOCUMENT"] = "DOCUMENT";
    MediaType["AUDIO"] = "AUDIO";
})(MediaType || (exports.MediaType = MediaType = {}));
class CreateUploadSessionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { mediaType: { required: true, enum: require("./create-upload-session.dto").MediaType, enum: Object.values(MediaType) }, mimeType: { required: true, type: () => String }, originalFilename: { required: true, type: () => String }, sizeBytes: { required: true, type: () => Number, minimum: 1, maximum: 100 * 1024 * 1024 }, caption: { required: false, type: () => String }, conversationId: { required: false, type: () => String }, clientMessageId: { required: false, type: () => String } };
    }
}
exports.CreateUploadSessionDto = CreateUploadSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: MediaType }),
    (0, class_validator_1.IsIn)(Object.values(MediaType)),
    __metadata("design:type", String)
], CreateUploadSessionDto.prototype, "mediaType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'image/jpeg' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUploadSessionDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'photo.jpg' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUploadSessionDto.prototype, "originalFilename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2048576 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100 * 1024 * 1024),
    __metadata("design:type", Number)
], CreateUploadSessionDto.prototype, "sizeBytes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'vacation photo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUploadSessionDto.prototype, "caption", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'conv-uuid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUploadSessionDto.prototype, "conversationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'msg-client-id' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUploadSessionDto.prototype, "clientMessageId", void 0);
//# sourceMappingURL=create-upload-session.dto.js.map