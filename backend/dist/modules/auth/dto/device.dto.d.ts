import { DevicePlatform } from '@prisma/client';
export declare class DeviceDto {
    deviceId: string;
    platform: DevicePlatform;
    pushToken?: string;
    appVersion?: string;
    osVersion?: string;
}
