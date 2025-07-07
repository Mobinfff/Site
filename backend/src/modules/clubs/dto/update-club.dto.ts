import { PartialType } from '@nestjs/mapped-types';
import { CreateClubDto, ClubImageInputDto } from './create-club.dto';
import { IsOptional, IsEnum, IsString, MaxLength, IsBoolean, IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ClubStatus } from '../entities/club.entity';
import { Type } from 'class-transformer';

export class UpdateClubDto extends PartialType(CreateClubDto) {
  // Fields from CreateClubDto are already optional due to PartialType

  // Admin-only or specific status changes might be handled in a separate DTO or service method
  @IsOptional()
  @IsEnum(ClubStatus, { message: `وضعیت باشگاه باید یکی از مقادیر زیر باشد: ${Object.values(ClubStatus).join(', ')}` })
  status?: ClubStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'دلیل رد نمی‌تواند بیشتر از 500 کاراکتر باشد.'})
  rejection_reason?: string; // Typically set by admin when status is REJECTED

  @IsOptional()
  @IsBoolean({ message: 'وضعیت فعالیت باشگاه (is_active) باید true یا false باشد.'})
  is_active?: boolean; // Club owner can set this

  @IsOptional()
  @IsBoolean({ message: 'وضعیت ویژه بودن باشگاه (is_featured) باید true یا false باشد.'})
  is_featured?: boolean; // Admin can set this

  // For updating images, it's often better to have separate endpoints
  // (e.g., POST /clubs/:id/images, DELETE /clubs/:id/images/:imageId)
  // However, if you want to allow replacing all images during an update:
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(10, { message: 'حداکثر 10 تصویر می‌توانید آپلود کنید.'})
  @Type(() => ClubImageInputDto)
  images?: ClubImageInputDto[]; // This would typically replace all existing images
}
