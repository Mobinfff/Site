import { PartialType } from '@nestjs/mapped-types';
import { CreateSportTypeDto } from './create-sport-type.dto';
import { IsOptional, IsBoolean } from 'class-validator';


export class UpdateSportTypeDto extends PartialType(CreateSportTypeDto) {
  // All fields from CreateSportTypeDto are optional.
  // is_active is already in CreateSportTypeDto and made optional by PartialType.
  // If we need to ensure it's always present in update, we'd redefine it without @IsOptional()
  // For example, if is_active must be explicitly passed on update:
  // @IsBoolean({message: "وضعیت فعال بودن باید true یا false باشد."})
  // is_active: boolean;
}
