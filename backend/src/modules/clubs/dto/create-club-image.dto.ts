import { IsString, IsNotEmpty, IsUrl, IsOptional, IsBoolean, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClubImageDto {
  @ApiProperty({
    description: 'URL of the image. This should be the public URL after uploading to a storage service (e.g., S3, Cloudinary).',
    example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  })
  @IsNotEmpty({ message: 'آدرس تصویر نباید خالی باشد.' })
  @IsUrl({}, { message: 'آدرس تصویر باید یک URL معتبر باشد.' })
  image_url: string;

  @ApiProperty({ description: 'Alternative text for the image.', required: false, example: 'Club main entrance' })
  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'متن جایگزین تصویر نمی‌تواند بیشتر از 250 کاراکتر باشد.'})
  alt_text?: string;

  @ApiProperty({ description: 'Is this the cover image for the club?', default: false, required: false })
  @IsOptional()
  @IsBoolean({ message: 'مقدار "تصویر کاور" باید true یا false باشد.'})
  is_cover?: boolean;

  @ApiProperty({ description: 'Order for displaying the image.', default: 0, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'ترتیب نمایش باید عدد باشد.'})
  display_order?: number;
}
