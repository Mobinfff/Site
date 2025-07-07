import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUrl } from 'class-validator';

export class CreateClubFacilityDto {
  @IsNotEmpty({ message: 'نام امکانات نباید خالی باشد.' })
  @IsString()
  @MaxLength(100, { message: 'نام امکانات نمی‌تواند بیشتر از 100 کاراکتر باشد.' })
  name: string;

  @IsOptional()
  @IsUrl({}, { message: 'آدرس آیکون باید یک URL معتبر باشد.'})
  @MaxLength(255)
  icon_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'توضیحات امکانات نمی‌تواند بیشتر از 500 کاراکتر باشد.'})
  description?: string;
}
