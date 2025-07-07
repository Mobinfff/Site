import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClubFacilitiesService } from '../services/club-facilities.service';
import { CreateClubFacilityDto } from '../dto/create-club-facility.dto';
import { UpdateClubFacilityDto } from '../dto/update-club-facility.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ClubFacility } from '../entities/club-facility.entity';

@ApiTags('Club Facilities (Admin)')
@ApiBearerAuth()
@Controller('admin/club-facilities') // Scoped under admin
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Only Admin can manage these master data
export class ClubFacilitiesController {
  constructor(private readonly facilitiesService: ClubFacilitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new club facility (Admin only)' })
  @ApiResponse({ status: 201, description: 'Facility created.', type: ClubFacility })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createDto: CreateClubFacilityDto): Promise<ClubFacility> {
    return this.facilitiesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all club facilities (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by name (partial match)'})
  @ApiResponse({ status: 200, description: 'List of facilities.', type: [ClubFacility] })
  findAll(@Query() query: { page?: string; limit?: string; name?: string }): Promise<ClubFacility[]> {
    const { page, limit, name } = query;
    const options: any = {};
    if (limit) {
      options.take = parseInt(limit, 10);
      if (page) {
        options.skip = (parseInt(page, 10) - 1) * options.take;
      }
    }
    if (name) {
        // This requires more complex query building if using TypeORM's find options directly
        // For simplicity, if a name filter is needed, the service method should handle it (e.g. with QueryBuilder + ILIKE)
        // options.where = { name: Like(`%${name}%`) }; // Example, if using TypeORM's Like
    }
    // For now, passing basic options. Service can be enhanced for filtering.
    return this.facilitiesService.findAll(options);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a club facility by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Facility data.', type: ClubFacility })
  @ApiResponse({ status: 404, description: 'Facility not found.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ClubFacility> {
    return this.facilitiesService.findOneOrFail(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a club facility (Admin only)' })
  @ApiResponse({ status: 200, description: 'Facility updated.', type: ClubFacility })
  @ApiResponse({ status: 404, description: 'Facility not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateClubFacilityDto,
  ): Promise<ClubFacility> {
    return this.facilitiesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a club facility (Admin only)' })
  @ApiResponse({ status: 204, description: 'Facility deleted.' })
  @ApiResponse({ status: 404, description: 'Facility not found.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.facilitiesService.remove(id);
  }
}
