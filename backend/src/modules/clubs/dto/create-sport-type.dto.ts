import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUrl, IsBoolean } from 'class-validator';

export class CreateSportTypeDto {
  @IsNotEmpty({ message: 'نام نوع ورزش نباید خالی باشد.' })
  @IsString()
  @MaxLength(100, { message: 'نام نوع ورزش نمی‌تواند بیشتر از 100 کاراکتر باشد.' })
  name: string;

  @IsOptional()
  @IsUrl({}, { message: 'آدرس آیکون باید یک URL معتبر باشد.'})
  @MaxLength(255)
  icon_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'توضیحات نوع ورزش نمی‌تواند بیشتر از 500 کاراکتر باشد.'})
  description?: string;

  @IsOptional()
  @IsBoolean({message: "وضعیت فعال بودن باید true یا false باشد."})
  is_active?: boolean = true;
}
