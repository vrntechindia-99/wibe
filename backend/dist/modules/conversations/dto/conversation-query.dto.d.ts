export declare enum ConversationSortBy {
    UPDATED_AT = "updatedAt",
    CREATED_AT = "createdAt"
}
export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
export declare class ConversationQueryDto {
    page?: number;
    limit?: number;
    sortBy?: ConversationSortBy;
    sortOrder?: SortOrder;
    includeArchived?: boolean;
    search?: string;
}
