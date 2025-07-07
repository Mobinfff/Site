import { PartialType } from '@nestjs/mapped-types';
import { CreateClubFacilityDto } from './create-club-facility.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateClubFacilityDto extends PartialType(CreateClubFacilityDto) {
  // All fields from CreateClubFacilityDto are optional.
  // We can add specific overrides if needed. For example, if 'name' should not be updatable once created,
  // it could be removed here, or a different DTO could be used for updates that don't allow name changes.
  // For now, we allow all fields from CreateClubFacilityDto to be updated.

  @IsOptional()
  @IsBoolean({message: "وضعیت فعال بودن باید true یا false باشد."})
  is_active?: boolean; // Assuming we might add an is_active field to ClubFacility entity
}
