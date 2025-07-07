import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SchedulesService } from '../services/schedules.service';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole, User as UserEntity } from '../../users/entities/user.entity';
import { Schedule } from '../entities/schedule.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Club Schedules')
@ApiBearerAuth()
@Controller('clubs/:clubId/schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new schedule for a club (Club Owner or Admin)' })
  @ApiParam({ name: 'clubId', type: 'string', format: 'uuid', description: 'ID of the club' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully.', type: Schedule })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Club not found.' })
  create(
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Body() createScheduleDto: CreateScheduleDto,
    @Req() req: { user: UserEntity },
  ): Promise<Schedule> {
    return this.schedulesService.create(clubId, createScheduleDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all schedules for a club (Public)' })
  @ApiParam({ name: 'clubId', type: 'string', format: 'uuid', description: 'ID of the club' })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'sport_type_id', required: false, type: Number, description: 'Filter by sport type ID' })
  @ApiQuery({ name: 'date', required: false, type: String, format: 'date', description: 'Filter schedules valid for a specific date (YYYY-MM-DD)'})
  @ApiResponse({ status: 200, description: 'List of schedules for the club.', type: [Schedule] })
  findAll(
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Query() query: { is_active?: string, sport_type_id?: string, date?: string },
  ): Promise<Schedule[]> {
    const options: any = { where: {} };
    if (query.is_active !== undefined) {
      options.where.is_active = query.is_active === 'true';
    }
    if (query.sport_type_id) {
      options.where.sport_type_id = parseInt(query.sport_type_id, 10);
    }
    // TODO: Add logic for filtering by 'date' (checking valid_from, valid_until, and days_of_week)
    // This requires more complex query logic in the service.
    if (Object.keys(options.where).length === 0) delete options.where;
    return this.schedulesService.findAllByClub(clubId, options);
  }

  @Get(':scheduleId')
  @ApiOperation({ summary: 'Get a specific schedule by ID (Public)' })
  @ApiParam({ name: 'clubId', type: 'string', format: 'uuid', description: 'ID of the club' })
  @ApiParam({ name: 'scheduleId', type: 'string', format: 'uuid', description: 'ID of the schedule' })
  @ApiResponse({ status: 200, description: 'Schedule data.', type: Schedule })
  @ApiResponse({ status: 404, description: 'Schedule or Club not found.' })
  findOne(
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
  ): Promise<Schedule> {
    return this.schedulesService.findOneOrFail(clubId, scheduleId);
  }

  @Patch(':scheduleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a schedule (Club Owner or Admin)' })
  @ApiParam({ name: 'clubId', type: 'string', format: 'uuid', description: 'ID of the club' })
  @ApiParam({ name: 'scheduleId', type: 'string', format: 'uuid', description: 'ID of the schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully.', type: Schedule })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Schedule or Club not found.' })
  update(
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @Req() req: { user: UserEntity },
  ): Promise<Schedule> {
    return this.schedulesService.update(clubId, scheduleId, updateScheduleDto, req.user);
  }

  @Delete(':scheduleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a schedule (Club Owner or Admin)' })
  @ApiParam({ name: 'clubId', type: 'string', format: 'uuid', description: 'ID of the club' })
  @ApiParam({ name: 'scheduleId', type: 'string', format: 'uuid', description: 'ID of the schedule' })
  @ApiResponse({ status: 204, description: 'Schedule deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Schedule or Club not found.' })
  remove(
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Req() req: { user: UserEntity },
  ): Promise<void> {
    return this.schedulesService.remove(clubId, scheduleId, req.user);
  }
}
