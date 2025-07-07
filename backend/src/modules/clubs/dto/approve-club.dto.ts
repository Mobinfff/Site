import { IsEnum, IsOptional, IsString, MaxLength, IsNotEmpty } from 'class-validator';
import { ClubStatus } from '../entities/club.entity';

export class ApproveClubDto {
  @IsNotEmpty({ message: 'وضعیت جدید باشگاه نباید خالی باشد.'})
  @IsEnum(
    [ClubStatus.APPROVED, ClubStatus.REJECTED], // Admin can only approve or reject through this DTO
    { message: `وضعیت باشگاه برای این عملیات باید یکی از مقادیر زیر باشد: ${ClubStatus.APPROVED}, ${ClubStatus.REJECTED}` }
  )
  status: ClubStatus.APPROVED | ClubStatus.REJECTED;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'دلیل رد/توضیحات نمی‌تواند بیشتر از 500 کاراکتر باشد.'})
  admin_comment?: string; // Could be rejection_reason or general comment
}
