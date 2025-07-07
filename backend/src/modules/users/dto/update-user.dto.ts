import { PartialType } from '@nestjs/mapped-types'; // npm install @nestjs/mapped-types
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsOptional, IsString, IsEnum, IsEmail, MinLength, Matches, Length } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Override or add specific validation for update if needed
  // For example, password might not be required on update, but if provided, must meet criteria

  @IsOptional()
  @IsString({ message: 'شماره موبایل باید رشته باشد.' })
  @Length(11, 11, { message: 'شماره موبایل باید 11 رقم باشد.' })
  @Matches(/^09[0-9]{9}$/, { message: 'فرمت شماره موبایل صحیح نیست (مثال: 09123456789).' })
  phone_number?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'رمز عبور باید حداقل 8 کاراکتر باشد.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
    message: 'رمز عبور باید شامل حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک کاراکتر خاص باشد.',
  })
  password?: string;

  @IsOptional()
  @IsEmail({}, { message: 'فرمت ایمیل صحیح نیست.' })
  @IsString({ message: 'ایمیل باید رشته باشد.'})
  email?: string;

  @IsOptional()
  @IsString({ message: 'نام باید رشته باشد.'})
  @Length(2, 50, { message: 'نام باید بین 2 تا 50 کاراکتر باشد.'})
  first_name?: string;

  @IsOptional()
  @IsString({ message: 'نام خانوادگی باید رشته باشد.'})
  @Length(2, 50, { message: 'نام خانوادگی باید بین 2 تا 50 کاراکتر باشد.'})
  last_name?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: `نقش کاربر باید یکی از مقادیر زیر باشد: ${Object.values(UserRole).join(', ')}` })
  role?: UserRole;

  @IsOptional()
  @IsString()
  profile_image_url?: string;

  @IsOptional()
  @IsBoolean({ message: 'وضعیت فعالیت باید true یا false باشد.'})
  is_active?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'وضعیت تایید شماره موبایل باید true یا false باشد.'})
  is_phone_verified?: boolean;
}
