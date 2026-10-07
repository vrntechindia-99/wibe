import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { MinioService } from '@modules/media/minio.service';

import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdateAvatarDto } from '../dto/update-avatar.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        displayName: dto.displayName,
        about: dto.about,
      },
      create: {
        userId,
        displayName: dto.displayName,
        about: dto.about,
      },
    });

    return profile;
  }

  async getAvatarUploadUrl(userId: string, dto: UpdateAvatarDto) {
    const fileName = `avatars/${userId}/${Date.now()}-${dto.fileName}`;
    const uploadUrl = await this.minioService.getPresignedUploadUrl(fileName, dto.contentType);
    const downloadUrl = await this.minioService.getPresignedDownloadUrl(fileName);

    return { uploadUrl, downloadUrl, fileName };
  }

  async confirmAvatarUpload(userId: string, avatarUrl: string) {
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl },
    });

    return profile;
  }

  async deleteAvatar(userId: string) {
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl: null },
    });

    return profile;
  }
}