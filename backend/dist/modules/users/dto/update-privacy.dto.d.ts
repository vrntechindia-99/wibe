import { PrivacyLevel } from '@prisma/client';
export declare class UpdatePrivacyDto {
    lastSeen?: PrivacyLevel;
    profilePhoto?: PrivacyLevel;
    about?: PrivacyLevel;
    readReceipts?: boolean;
    status?: PrivacyLevel;
    groups?: PrivacyLevel;
}
