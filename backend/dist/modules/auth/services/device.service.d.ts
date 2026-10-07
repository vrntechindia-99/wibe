import { PrismaService } from '@shared/database/prisma.service';
import { DeviceDto } from '../dto/device.dto';
export declare class DeviceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    registerDevice(userId: string, dto: DeviceDto): Promise<any>;
    getUserDevices(userId: string): Promise<any>;
    updateDeviceActivity(deviceId: string): Promise<void>;
    revokeDevice(userId: string, deviceId: string): Promise<void>;
    getDeviceById(deviceId: string): Promise<any>;
    updatePushToken(deviceId: string, pushToken: string): Promise<void>;
}
