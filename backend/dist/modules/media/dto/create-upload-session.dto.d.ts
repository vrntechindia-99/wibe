export declare enum MediaType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
    DOCUMENT = "DOCUMENT",
    AUDIO = "AUDIO"
}
export declare class CreateUploadSessionDto {
    mediaType: MediaType;
    mimeType: string;
    originalFilename: string;
    sizeBytes: number;
    caption?: string;
    conversationId?: string;
    clientMessageId?: string;
}
