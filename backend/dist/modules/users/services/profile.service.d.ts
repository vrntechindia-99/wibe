import { PrismaService } from '@shared/database/prisma.service';
import { MinioService } from '@modules/media/minio.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdateAvatarDto } from '../dto/update-avatar.dto';
export declare class ProfileService {
    private readonly prisma;
    private readonly minioService;
    constructor(prisma: PrismaService, minioService: MinioService);
    getProfile(userId: string): Promise<any>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<any>;
    getAvatarUploadUrl(userId: string, dto: UpdateAvatarDto): Promise<{
        uploadUrl: any;
        downloadUrl: any;
        fileName: string;
    }>;
    confirmAvatarUpload(userId: string, avatarUrl: string): Promise<any>;
    deleteAvatar(userId: string): Promise<any>;
}
