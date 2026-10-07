import { PrismaService } from '@shared/database/prisma.service';
import { MediaService } from '@modules/media/services/media.service';
import { RedisService } from '@shared/database/redis.service';
export declare class VoiceMessagesService {
    private readonly prisma;
    private readonly mediaService;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, mediaService: MediaService, redis: RedisService);
    getVoiceMessage(messageId: string, userId: string): Promise<{
        id: any;
        clientMessageId: any;
        conversationId: any;
        senderId: any;
        duration: any;
        waveform: any;
        downloadUrl: any;
        status: any;
        createdAt: any;
    }>;
    getVoiceMessagesInConversation(conversationId: string, userId: string): Promise<any>;
    deleteVoiceMessage(messageId: string, userId: string): Promise<{
        message: string;
    }>;
    saveWaveformData(attachmentId: string, waveform: number[]): Promise<void>;
}
