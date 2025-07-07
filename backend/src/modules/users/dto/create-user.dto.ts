import { IsString, IsEmail, IsOptional, IsEnum, MinLength, Matches, IsNotEmpty, Length } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsNotEmpty({ message: 'شماره موبایل نباید خالی باشد.' })
  @IsString({ message: 'شماره موبایل باید رشته باشد.' })
  @Length(11, 11, { message: 'شماره موبایل باید 11 رقم باشد.' })
  @Matches(/^09[0-9]{9}$/, { message: 'فرمت شماره موبایل صحیح نیست (مثال: 09123456789).' })
  phone_number: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'رمز عبور باید حداقل 8 کاراکتر باشد.' })
  // Example: At least one uppercase, one lowercase, one number, one special character
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
  role?: UserRole = UserRole.USER; // Default role if not provided

  @IsOptional()
  @IsString()
  profile_image_url?: string;

  // is_active and is_phone_verified are usually set by the system, not directly by DTO on creation by user
}
