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
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User as UserEntity } from './entities/user.entity'; // Renamed User to UserEntity to avoid conflict
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'; // For API documentation

@ApiTags('Users')
@ApiBearerAuth() // Indicates that JWT is required for these endpoints
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards to the whole controller
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN) // Only ADMIN can create users directly through this endpoint
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'The user has been successfully created.', type: UserEntity })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createUserDto: CreateUserDto, @Req() req: { user: UserEntity }): Promise<UserEntity> {
    return this.usersService.create(createUserDto, req.user.role);
  }

  @Get()
  @Roles(UserRole.ADMIN) // Only ADMIN can get all users
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filter by user role' })
  @ApiResponse({ status: 200, description: 'List of users.', type: [UserEntity] })
  async findAll(@Query() query: { page?: string; limit?: string; role?: UserRole }): Promise<UserEntity[]> {
    const { page, limit, role } = query;
    const options: any = {}; // TypeORM FindManyOptions
    if (limit) {
      options.take = parseInt(limit, 10);
      if (page) {
        options.skip = (parseInt(page, 10) - 1) * options.take;
      }
    }
    if (role) {
      options.where = { role };
    }
    return this.usersService.findAll(options);
  }

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.CLUB_OWNER, UserRole.USER) // All authenticated users can get their own profile
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user data.', type: UserEntity })
  async findMe(@Req() req: { user: UserEntity }): Promise<UserEntity> {
    // req.user is populated by JwtAuthGuard/JwtStrategy with basic info (id, phone, role)
    // We fetch the full profile using the ID from the token payload
    const fullUserProfile = await this.usersService.findOneOrFail(req.user.id);
    return fullUserProfile;
  }

  @Get(':id')
  @Roles(UserRole.ADMIN) // Only ADMIN can get any user by ID
  @ApiOperation({ summary: 'Get a user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User data.', type: UserEntity })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserEntity> {
    return this.usersService.findOneOrFail(id);
  }

  @Patch('me')
  @Roles(UserRole.ADMIN, UserRole.CLUB_OWNER, UserRole.USER) // All authenticated users can update their own profile
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User updated successfully.', type: UserEntity })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., trying to change role without permission).' })
  async updateMe(@Req() req: { user: UserEntity }, @Body() updateUserDto: UpdateUserDto): Promise<UserEntity> {
    if (updateUserDto.role && updateUserDto.role !== req.user.role && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('شما مجاز به تغییر نقش خود نیستید.');
    }
    // Prevent non-admins from making themselves admin
    if (updateUserDto.role === UserRole.ADMIN && req.user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('شما نمی‌توانید نقش خود را به ادمین تغییر دهید.');
    }
    // Users cannot change their own 'is_active' or 'is_phone_verified' status directly via this endpoint.
    // These should be handled by specific processes (e.g., phone verification flow, admin actions).
    delete updateUserDto.is_active;
    delete updateUserDto.is_phone_verified;

    return this.usersService.update(req.user.id, updateUserDto, req.user);
  }


  @Patch(':id')
  @Roles(UserRole.ADMIN) // Only ADMIN can update any user by ID
  @ApiOperation({ summary: 'Update a user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully.', type: UserEntity })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: { user: UserEntity },
  ): Promise<UserEntity> {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN) // Only ADMIN can delete users
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user by ID (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g. trying to delete last admin).' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: { user: UserEntity }): Promise<void> {
    return this.usersService.remove(id, req.user);
  }
}
