import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  Matches,
  Min,
  Max,
  ArrayNotEmpty,
  ArrayMinSize,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { GenderSpecific, ScheduleStatus } from '../entities/schedule.entity';

export class CreateScheduleDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'نام سانس نمی‌تواند بیشتر از 200 کاراکتر باشد.'})
  name?: string;

  @IsNotEmpty({ message: 'زمان شروع سانس نباید خالی باشد.'})
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, { message: 'فرمت زمان شروع سانس نامعتبر است (HH:MM یا HH:MM:SS).' })
  start_time: string; // e.g., "08:00" or "14:30:00"

  @IsNotEmpty({ message: 'زمان پایان سانس نباید خالی باشد.'})
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, { message: 'فرمت زمان پایان سانس نامعتبر است (HH:MM یا HH:MM:SS).' })
  // TODO: Add custom validator to ensure end_time is after start_time
  end_time: string;

  @IsNotEmpty({ message: 'روزهای هفته نباید خالی باشد.'})
  @IsArray({ message: 'روزهای هفته باید آرایه باشد.'})
  @ArrayNotEmpty({ message: 'حداقل یک روز از هفته باید انتخاب شود.'})
  @ArrayMinSize(1, { message: 'حداقل یک روز از هفته باید انتخاب شود.'})
  // Each item can be a number (0-6) or string ('SUNDAY'-'SATURDAY') - needs custom validation or transformation
  // For simplicity, we might enforce numbers here if transformation is handled in service
  @IsNumber({}, { each: true, message: 'هر آیتم در روزهای هفته باید یک عدد (0-6) باشد.' }) // Or use IsString if using names
  @Min(0, { each: true, message: 'عدد روز هفته باید بین 0 تا 6 باشد.'})
  @Max(6, { each: true, message: 'عدد روز هفته باید بین 0 تا 6 باشد.'})
  days_of_week: number[]; // e.g., [0, 2, 4] for Sunday, Tuesday, Thursday

  @IsNotEmpty({ message: 'ظرفیت سانس نباید خالی باشد.'})
  @IsNumber({}, { message: 'ظرفیت سانس باید عدد باشد.'})
  @Min(1, { message: 'ظرفیت سانس باید حداقل 1 نفر باشد.'})
  @Max(1000, { message: 'ظرفیت سانس نمی‌تواند بیشتر از 1000 نفر باشد.'}) // Arbitrary max
  capacity: number;

  @IsNotEmpty({ message: 'قیمت سانس نباید خالی باشد.'})
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'قیمت سانس باید عدد با حداکثر دو رقم اعشار باشد.'})
  @Min(0, { message: 'قیمت سانس نمی‌تواند منفی باشد.'})
  price: number;

  @IsOptional()
  @IsEnum(GenderSpecific, { message: `محدودیت جنسیتی باید یکی از مقادیر ${Object.values(GenderSpecific).join(', ')} باشد.` })
  gender?: GenderSpecific = GenderSpecific.BOTH;

  @IsOptional()
  @IsNumber({}, {message: "شناسه نوع ورزش باید عدد باشد."})
  sport_type_id?: number;

  @IsOptional()
  @IsBoolean({ message: 'وضعیت فعالیت سانس (is_active) باید true یا false باشد.'})
  is_active?: boolean = true;

  @IsOptional()
  @IsDateString({}, { message: 'تاریخ شروع اعتبار سانس نامعتبر است.' })
  valid_from?: string; // YYYY-MM-DD

  @IsOptional()
  @IsDateString({}, { message: 'تاریخ پایان اعتبار سانس نامعتبر است.' })
  @ValidateIf(o => o.valid_from != null) // Only validate if valid_from is also provided
  // TODO: Add custom validator to ensure valid_until is after valid_from
  valid_until?: string; // YYYY-MM-DD

  @IsOptional()
  @IsEnum(ScheduleStatus, { message: `وضعیت سانس باید یکی از مقادیر ${Object.values(ScheduleStatus).join(', ')} باشد.` })
  schedule_status?: ScheduleStatus = ScheduleStatus.OPEN;

  // club_id will be taken from the route parameter (e.g., /clubs/:clubId/schedules)
}
