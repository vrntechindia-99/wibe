export declare enum MessageSortBy {
    CREATED_AT = "createdAt"
}
export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
export declare class MessageQueryDto {
    page?: number;
    limit?: number;
    before?: string;
    after?: string;
    sortBy?: MessageSortBy;
    sortOrder?: SortOrder;
}
