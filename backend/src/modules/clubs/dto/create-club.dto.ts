import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsUrl,
  MaxLength,
  MinLength,
  IsPhoneNumber,
  IsEmail,
  IsLatitude,
  IsLongitude,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO for individual image information during club creation
export class ClubImageInputDto {
  @IsNotEmpty({ message: 'آدرس تصویر نباید خالی باشد.' })
  @IsUrl({}, { message: 'آدرس تصویر باید یک URL معتبر باشد.' })
  image_url: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  alt_text?: string;

  @IsOptional()
  @IsBoolean()
  is_cover?: boolean;

  @IsOptional()
  @IsNumber()
  display_order?: number;
}


export class CreateClubDto {
  @IsNotEmpty({ message: 'نام باشگاه نباید خالی باشد.' })
  @IsString()
  @MinLength(3, { message: 'نام باشگاه باید حداقل 3 کاراکتر باشد.' })
  @MaxLength(200, { message: 'نام باشگاه نمی‌تواند بیشتر از 200 کاراکتر باشد.' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'توضیحات باشگاه نمی‌تواند بیشتر از 5000 کاراکتر باشد.' })
  description?: string;

  @IsNotEmpty({ message: 'آدرس باشگاه نباید خالی باشد.' })
  @IsString()
  @MaxLength(500, { message: 'آدرس باشگاه نمی‌تواند بیشتر از 500 کاراکتر باشد.' })
  address: string;

  @IsOptional()
  @IsLatitude({ message: 'مقدار عرض جغرافیایی نامعتبر است.' })
  latitude?: number;

  @IsOptional()
  @IsLongitude({ message: 'مقدار طول جغرافیایی نامعتبر است.' })
  longitude?: number;

  @IsOptional()
  @IsPhoneNumber('IR', { message: 'شماره تلفن باشگاه نامعتبر است.' }) // Validate for Iran phone numbers
  phone_number?: string;

  @IsOptional()
  @IsEmail({}, { message: 'فرمت ایمیل باشگاه نامعتبر است.' })
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsUrl({}, { message: 'آدرس وب‌سایت باشگاه باید یک URL معتبر باشد.' })
  @MaxLength(200)
  website?: string;

  // IDs of facilities and sport types
  @IsOptional()
  @IsArray({ message: 'لیست ID امکانات باید آرایه باشد.' })
  @IsNumber({}, { each: true, message: 'هر ID امکانات باید یک عدد باشد.' })
  facility_ids?: number[];

  @IsOptional()
  @IsArray({ message: 'لیست ID انواع ورزش باید آرایه باشد.' })
  @IsNumber({}, { each: true, message: 'هر ID انواع ورزش باید یک عدد باشد.' })
  sport_type_ids?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0) // Can be 0 if images are optional on creation, or 1 if at least one is required
  @ArrayMaxSize(10, { message: 'حداکثر 10 تصویر می‌توانید آپلود کنید.'}) // Example limit
  @Type(() => ClubImageInputDto)
  images?: ClubImageInputDto[];
}
