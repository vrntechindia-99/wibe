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
exports.ConversationQueryDto = exports.SortOrder = exports.ConversationSortBy = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
var ConversationSortBy;
(function (ConversationSortBy) {
    ConversationSortBy["UPDATED_AT"] = "updatedAt";
    ConversationSortBy["CREATED_AT"] = "createdAt";
})(ConversationSortBy || (exports.ConversationSortBy = ConversationSortBy = {}));
var SortOrder;
(function (SortOrder) {
    SortOrder["ASC"] = "asc";
    SortOrder["DESC"] = "desc";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
class ConversationQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
        this.sortBy = ConversationSortBy.UPDATED_AT;
        this.sortOrder = SortOrder.DESC;
        this.includeArchived = false;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1, maximum: 100 }, sortBy: { required: false, default: ConversationSortBy.UPDATED_AT, enum: require("./conversation-query.dto").ConversationSortBy }, sortOrder: { required: false, default: SortOrder.DESC, enum: require("./conversation-query.dto").SortOrder }, includeArchived: { required: false, type: () => Boolean, default: false }, search: { required: false, type: () => String } };
    }
}
exports.ConversationQueryDto = ConversationQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ConversationQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ConversationQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ConversationSortBy }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ConversationSortBy),
    __metadata("design:type", String)
], ConversationQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: SortOrder }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SortOrder),
    __metadata("design:type", String)
], ConversationQueryDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConversationQueryDto.prototype, "includeArchived", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    IsString(),
    __metadata("design:type", String)
], ConversationQueryDto.prototype, "search", void 0);
//# sourceMappingURL=conversation-query.dto.js.map