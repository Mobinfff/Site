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
import { SportTypesService } from '../services/sport-types.service';
import { CreateSportTypeDto } from '../dto/create-sport-type.dto';
import { UpdateSportTypeDto } from '../dto/update-sport-type.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SportType } from '../entities/sport-type.entity';

@ApiTags('Sport Types (Admin)')
@ApiBearerAuth()
@Controller('admin/sport-types') // Scoped under admin
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Only Admin can manage these master data
export class SportTypesController {
  constructor(private readonly sportTypesService: SportTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sport type (Admin only)' })
  @ApiResponse({ status: 201, description: 'Sport type created.', type: SportType })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createDto: CreateSportTypeDto): Promise<SportType> {
    return this.sportTypesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sport types (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by name (partial match)'})
  @ApiQuery({ name: 'is_active', required: false, type: Boolean, description: 'Filter by active status'})
  @ApiResponse({ status: 200, description: 'List of sport types.', type: [SportType] })
  findAll(@Query() query: { page?: string; limit?: string; name?: string, is_active?: string }): Promise<SportType[]> {
    const { page, limit, name, is_active } = query;
    const options: any = { where: {} };
    if (limit) {
      options.take = parseInt(limit, 10);
      if (page) {
        options.skip = (parseInt(page, 10) - 1) * options.take;
      }
    }
    if (name) {
      // options.where.name = Like(`%${name}%`); // Requires TypeORM Like
    }
    if (is_active !== undefined) {
        options.where.is_active = is_active === 'true';
    }
    if (Object.keys(options.where).length === 0) delete options.where;
    return this.sportTypesService.findAll(options);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sport type by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Sport type data.', type: SportType })
  @ApiResponse({ status: 404, description: 'Sport type not found.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SportType> {
    return this.sportTypesService.findOneOrFail(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sport type (Admin only)' })
  @ApiResponse({ status: 200, description: 'Sport type updated.', type: SportType })
  @ApiResponse({ status: 404, description: 'Sport type not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSportTypeDto,
  ): Promise<SportType> {
    return this.sportTypesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a sport type (Admin only)' })
  @ApiResponse({ status: 204, description: 'Sport type deleted.' })
  @ApiResponse({ status: 404, description: 'Sport type not found.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.sportTypesService.remove(id);
  }
}
