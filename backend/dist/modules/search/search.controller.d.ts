import { Request } from 'express';
import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    searchUsers(query: string, limit: number, req: Request): Promise<any>;
    searchConversations(query: string, limit: number, req: Request): Promise<any>;
    searchMessages(query: string, conversationId: string, limit: number, req: Request): Promise<any>;
}
