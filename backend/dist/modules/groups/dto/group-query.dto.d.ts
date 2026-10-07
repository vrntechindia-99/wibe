export declare enum GroupSortBy {
    UPDATED_AT = "updatedAt",
    CREATED_AT = "createdAt",
    NAME = "name",
    MEMBER_COUNT = "memberCount"
}
export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
export declare class GroupQueryDto {
    page?: number;
    limit?: number;
    sortBy?: GroupSortBy;
    sortOrder?: SortOrder;
    search?: string;
}
