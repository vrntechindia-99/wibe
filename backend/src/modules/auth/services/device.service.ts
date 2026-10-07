import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { DeviceDto } from '../dto/device.dto';
import { DevicePlatform } from '@prisma/client';

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(userId: string, dto: DeviceDto) {
    const device = await this.prisma.device.upsert({
      where: { deviceId: dto.deviceId },
      update: {
        userId,
        platform: dto.platform,
        pushToken: dto.pushToken,
        appVersion: dto.appVersion,
        osVersion: dto.osVersion,
        lastActiveAt: new Date(),
      },
      create: {
        userId,
        deviceId: dto.deviceId,
        platform: dto.platform,
        pushToken: dto.pushToken,
        appVersion: dto.appVersion,
        osVersion: dto.osVersion,
      },
    });

    return device;
  }

  async getUserDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async updateDeviceActivity(deviceId: string) {
    await this.prisma.device.update({
      where: { deviceId },
      data: { lastActiveAt: new Date() },
    });
  }

  async revokeDevice(userId: string, deviceId: string) {
    await this.prisma.device.deleteMany({
      where: { userId, deviceId },
    });
  }

  async getDeviceById(deviceId: string) {
    return this.prisma.device.findUnique({
      where: { deviceId },
      include: { user: true },
    });
  }

  async updatePushToken(deviceId: string, pushToken: string) {
    await this.prisma.device.update({
      where: { deviceId },
      data: { pushToken },
    });
  }
}