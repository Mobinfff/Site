import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty({ message: 'شماره موبایل نباید خالی باشد.' })
  @IsString({ message: 'شماره موبایل باید رشته باشد.' })
  @Length(11, 11, { message: 'شماره موبایل باید 11 رقم باشد.' })
  @Matches(/^09[0-9]{9}$/, { message: 'فرمت شماره موبایل صحیح نیست (مثال: 09123456789).' })
  phone_number: string;
}
