import { Request } from 'express';
import { VoiceMessagesService } from './services/voice-messages.service';
export declare class VoiceMessagesController {
    private readonly voiceMessagesService;
    constructor(voiceMessagesService: VoiceMessagesService);
    getVoiceMessage(messageId: string, req: Request): Promise<{
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
    getVoiceMessagesInConversation(conversationId: string, req: Request): Promise<any>;
    deleteVoiceMessage(messageId: string, req: Request): Promise<{
        message: string;
    }>;
}
