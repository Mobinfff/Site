import { PartialType } from '@nestjs/swagger'; // Use PartialType from swagger for DTO updates if using swagger
// Or import { PartialType } from '@nestjs/mapped-types'; if not using swagger for this specifically
import { CreateClubImageDto } from './create-club-image.dto';
import { IsOptional, IsString, IsUrl, MaxLength, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';


export class UpdateClubImageDto extends PartialType(CreateClubImageDto) {
  // All fields from CreateClubImageDto are optional due to PartialType.
  // We can override if specific validation is needed for update.

  @ApiPropertyOptional({
    description: 'URL of the image. Only provide if you want to change the image URL itself (rare for updates, usually delete and add new).',
  })
  @IsOptional()
  @IsUrl({}, { message: 'آدرس تصویر باید یک URL معتبر باشد.' })
  image_url?: string;

  @ApiPropertyOptional({ description: 'Alternative text for the image.'})
  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'متن جایگزین تصویر نمی‌تواند بیشتر از 250 کاراکتر باشد.'})
  alt_text?: string;

  @ApiPropertyOptional({ description: 'Is this the cover image for the club?' })
  @IsOptional()
  @IsBoolean({ message: 'مقدار "تصویر کاور" باید true یا false باشد.'})
  is_cover?: boolean;

  @ApiPropertyOptional({ description: 'Order for displaying the image.' })
  @IsOptional()
  @IsNumber({}, { message: 'ترتیب نمایش باید عدد باشد.'})
  display_order?: number;
}
