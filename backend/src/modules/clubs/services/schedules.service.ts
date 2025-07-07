import { Injectable, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { Schedule, ScheduleStatus } from '../entities/schedule.entity';
import { Club, ClubStatus } from '../entities/club.entity';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { User, UserRole } from '../../users/entities/user.entity';
import { SportTypesService } from './sport-types.service'; // If needed for sport_type validation

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Club) // To check club ownership and status
    private readonly clubRepository: Repository<Club>,
    private readonly sportTypesService: SportTypesService, // Optional, if validating sport_type_id
  ) {}

  private async getClubAndValidateOwner(clubId: string, currentUser: User): Promise<Club> {
    const club = await this.clubRepository.findOne({where: {id: clubId}, relations: ['owner']});
    if (!club) {
      throw new NotFoundException(`باشگاهی با شناسه '${clubId}' یافت نشد.`);
    }
    if (club.owner_id !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('شما مجاز به مدیریت سانس‌های این باشگاه نیستید.');
    }
    if (club.status !== ClubStatus.APPROVED && currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('فقط برای باشگاه‌های تایید شده می‌توان سانس تعریف یا ویرایش کرد.');
    }
    return club;
  }

  // Validate start_time and end_time logic
  private validateTimeLogic(startTime: string, endTime: string, existingSchedules: Schedule[], scheduleIdToIgnore?: string) {
    const newStartTime = new Date(`1970-01-01T${startTime}`);
    const newEndTime = new Date(`1970-01-01T${endTime}`);

    if (newEndTime <= newStartTime) {
      throw new BadRequestException('زمان پایان سانس باید بعد از زمان شروع آن باشد.');
    }

    // Check for overlaps with existing schedules for the same days (basic check, can be more complex)
    // This is a simplified overlap check. A more robust check would consider specific dates and recurring patterns.
    for (const existing of existingSchedules) {
        if (scheduleIdToIgnore && existing.id === scheduleIdToIgnore) continue;

        const existingStartTime = new Date(`1970-01-01T${existing.start_time}`);
        const existingEndTime = new Date(`1970-01-01T${existing.end_time}`);

        // Basic overlap: (StartA < EndB) and (EndA > StartB)
        // This doesn't check for day_of_week overlap here, assume it's for schedules on potentially same days
        // A more complex validation would iterate through days_of_week for both new and existing schedules
        if (newStartTime < existingEndTime && newEndTime > existingStartTime) {
            // This is a potential overlap in time, further checks for days_of_week would be needed
            // For now, we'll keep it simple. If days_of_week also overlap, then it's a true conflict.
            // console.warn(`Potential time overlap with existing schedule ${existing.id}`);
        }
    }
  }


  async create(clubId: string, createScheduleDto: CreateScheduleDto, currentUser: User): Promise<Schedule> {
    await this.getClubAndValidateOwner(clubId, currentUser);

    if (createScheduleDto.sport_type_id) {
      const sportType = await this.sportTypesService.findOne(createScheduleDto.sport_type_id);
      if (!sportType) {
        throw new BadRequestException(`نوع ورزشی با شناسه '${createScheduleDto.sport_type_id}' یافت نشد.`);
      }
    }

    // Fetch existing schedules for basic overlap check (can be improved)
    const existingSchedules = await this.scheduleRepository.find({ where: { club_id: clubId, is_active: true } });
    this.validateTimeLogic(createScheduleDto.start_time, createScheduleDto.end_time, existingSchedules);


    const schedule = this.scheduleRepository.create({
      ...createScheduleDto,
      club_id: clubId,
      current_occupancy: 0, // Initial occupancy
      schedule_status: createScheduleDto.schedule_status || ScheduleStatus.OPEN,
    });

    try {
      return await this.scheduleRepository.save(schedule);
    } catch (error) {
      this.logger.error(`Failed to create schedule for club ${clubId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('خطا در ایجاد سانس جدید.');
    }
  }

  async findAllByClub(clubId: string, options?: FindManyOptions<Schedule>): Promise<Schedule[]> {
    // Public users should also be able to see schedules, so no ownership check here by default,
    // but ensure club itself is active/approved if this is a public endpoint.
    const club = await this.clubRepository.findOneBy({id: clubId});
    if (!club || (club.status !== ClubStatus.APPROVED && club.status !== ClubStatus.TEMPORARILY_CLOSED)) { // Allow seeing schedules for temp closed clubs
        // throw new NotFoundException(`باشگاه '${clubId}' یافت نشد یا در وضعیت مناسب برای نمایش سانس‌ها نیست.`);
        return []; // Or return empty if club not found/approved for public view
    }

    return this.scheduleRepository.find({
      where: { club_id: clubId, ...options?.where },
      relations: ['sport_type', ...(options?.relations || [])], // Eager load sport_type
      ...options,
    });
  }

  async findOne(clubId: string, scheduleId: string, options?: FindOneOptions<Schedule>): Promise<Schedule | null> {
    return this.scheduleRepository.findOne({
        where: { id: scheduleId, club_id: clubId },
        relations: ['sport_type', 'club', ...(options?.relations || [])],
        ...options
    });
  }

  async findOneOrFail(clubId: string, scheduleId: string, options?: FindOneOptions<Schedule>): Promise<Schedule> {
    const schedule = await this.findOne(clubId, scheduleId, options);
    if (!schedule) {
      throw new NotFoundException(`سانسی با شناسه '${scheduleId}' برای باشگاه '${clubId}' یافت نشد.`);
    }
    return schedule;
  }

  async update(clubId: string, scheduleId: string, updateScheduleDto: UpdateScheduleDto, currentUser: User): Promise<Schedule> {
    await this.getClubAndValidateOwner(clubId, currentUser);
    const schedule = await this.findOneOrFail(clubId, scheduleId);

    if (updateScheduleDto.sport_type_id && updateScheduleDto.sport_type_id !== schedule.sport_type_id) {
      const sportType = await this.sportTypesService.findOne(updateScheduleDto.sport_type_id);
      if (!sportType) {
        throw new BadRequestException(`نوع ورزشی با شناسه '${updateScheduleDto.sport_type_id}' یافت نشد.`);
      }
    }

    const startTime = updateScheduleDto.start_time || schedule.start_time;
    const endTime = updateScheduleDto.end_time || schedule.end_time;
    if (updateScheduleDto.start_time || updateScheduleDto.end_time) {
        const existingSchedules = await this.scheduleRepository.find({ where: { club_id: clubId, is_active: true } });
        this.validateTimeLogic(startTime, endTime, existingSchedules, scheduleId);
    }


    // Logic for status changes: if capacity is changed, status might need re-evaluation
    if (updateScheduleDto.capacity !== undefined && schedule.current_occupancy >= updateScheduleDto.capacity) {
      if(updateScheduleDto.schedule_status === undefined || updateScheduleDto.schedule_status === ScheduleStatus.OPEN) {
        updateScheduleDto.schedule_status = ScheduleStatus.FULL;
      }
    } else if (updateScheduleDto.capacity !== undefined && schedule.current_occupancy < updateScheduleDto.capacity) {
       if(updateScheduleDto.schedule_status === undefined || updateScheduleDto.schedule_status === ScheduleStatus.FULL) {
         // If it was full and now has capacity, and admin/owner hasn't explicitly set it to CLOSED/CANCELLED
         if (schedule.schedule_status === ScheduleStatus.FULL) { // Only reopen if it was full
            updateScheduleDto.schedule_status = ScheduleStatus.OPEN;
         }
       }
    }


    Object.assign(schedule, updateScheduleDto);

    try {
      return await this.scheduleRepository.save(schedule);
    } catch (error) {
      this.logger.error(`Failed to update schedule ${scheduleId} for club ${clubId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('خطا در به‌روزرسانی سانس.');
    }
  }

  async remove(clubId: string, scheduleId: string, currentUser: User): Promise<void> {
    await this.getClubAndValidateOwner(clubId, currentUser);
    const schedule = await this.findOneOrFail(clubId, scheduleId); // Ensures it exists and belongs to the club

    // Check if there are any active bookings for this schedule before deleting
    // This requires Booking entity and service, for now, we skip this check.
    // if (schedule.current_occupancy > 0 && schedule.schedule_status !== ScheduleStatus.CANCELLED) {
    //   throw new BadRequestException('امکان حذف سانس با رزروهای فعال وجود ندارد. ابتدا رزروها را لغو یا سانس را کنسل کنید.');
    // }

    const result = await this.scheduleRepository.delete({ id: scheduleId, club_id: clubId });
    if (result.affected === 0) {
      throw new NotFoundException(`سانسی با شناسه '${scheduleId}' یافت نشد (ممکن است همزمان حذف شده باشد).`);
    }
  }

  // --- Methods to be called by BookingService ---
  async incrementOccupancy(scheduleId: string, clubId: string, date: Date): Promise<Schedule> {
    // This is a simplified version. A robust solution would use a ScheduleInstance table for specific dates.
    const schedule = await this.findOneOrFail(clubId, scheduleId);
    if (schedule.current_occupancy >= schedule.capacity) {
      throw new BadRequestException('ظرفیت این سانس تکمیل شده است.');
    }
    if (schedule.schedule_status !== ScheduleStatus.OPEN) {
        throw new BadRequestException(`این سانس در وضعیت '${schedule.schedule_status}' بوده و امکان رزرو وجود ندارد.`);
    }

    schedule.current_occupancy += 1;
    if (schedule.current_occupancy === schedule.capacity) {
      schedule.schedule_status = ScheduleStatus.FULL;
    }
    return this.scheduleRepository.save(schedule);
  }

  async decrementOccupancy(scheduleId: string, clubId: string, date: Date): Promise<Schedule> {
    const schedule = await this.findOneOrFail(clubId, scheduleId);
    if (schedule.current_occupancy > 0) {
      schedule.current_occupancy -= 1;
      if (schedule.schedule_status === ScheduleStatus.FULL && schedule.current_occupancy < schedule.capacity) {
        schedule.schedule_status = ScheduleStatus.OPEN; // Re-open if it was full and now has space
      }
    }
    return this.scheduleRepository.save(schedule);
  }
}
