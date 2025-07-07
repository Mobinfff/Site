import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { RequestOtpDto } from './request-otp.dto'; // Can extend or use directly

export class VerifyOtpDto extends RequestOtpDto {
  @IsNotEmpty({ message: 'کد OTP نباید خالی باشد.' })
  @IsString({ message: 'کد OTP باید رشته باشد.' })
  @Length(6, 6, { message: 'کد OTP باید 6 رقم باشد.' }) // Assuming OTP is 6 digits
  @Matches(/^[0-9]{6}$/, { message: 'فرمت کد OTP صحیح نیست.'})
  code: string;
}
