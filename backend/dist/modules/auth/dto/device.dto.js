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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class DeviceDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { deviceId: { required: true, type: () => String }, platform: { required: true, type: () => Object }, pushToken: { required: false, type: () => String }, appVersion: { required: false, type: () => String }, osVersion: { required: false, type: () => String } };
    }
}
exports.DeviceDto = DeviceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'device-uuid-123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeviceDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.DevicePlatform, example: client_1.DevicePlatform.ANDROID }),
    (0, class_validator_1.IsEnum)(client_1.DevicePlatform),
    __metadata("design:type", typeof (_a = typeof client_1.DevicePlatform !== "undefined" && client_1.DevicePlatform) === "function" ? _a : Object)
], DeviceDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeviceDto.prototype, "pushToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeviceDto.prototype, "appVersion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeviceDto.prototype, "osVersion", void 0);
//# sourceMappingURL=device.dto.js.map