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
import { BookingsService } from '../services/bookings.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto'; // For admin
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole, User as UserEntity } from '../../users/entities/user.entity';
import { Booking } from '../entities/booking.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard) // Apply JWT guard to all booking routes
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(UserRole.USER, UserRole.CLUB_OWNER, UserRole.ADMIN) // All authenticated users can attempt to create bookings
  @ApiOperation({ summary: 'Create a new booking (Authenticated User)' })
  @ApiResponse({ status: 201, description: 'Booking initiated successfully, pending payment.', type: Booking })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., schedule full, invalid date).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Schedule not found.' })
  @ApiResponse({ status: 409, description: 'Conflict (e.g., already booked).' })
  create(@Body() createBookingDto: CreateBookingDto, @Req() req: { user: UserEntity }): Promise<Booking> {
    return this.bookingsService.createBooking(req.user, createBookingDto);
  }

  @Get('my-bookings')
  @Roles(UserRole.USER, UserRole.CLUB_OWNER, UserRole.ADMIN) // Any authenticated user can see their own bookings
  @ApiOperation({ summary: 'Get bookings for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by booking status' })
  @ApiResponse({ status: 200, description: 'List of current user bookings.', type: [Booking] })
  findMyBookings(
    @Req() req: { user: UserEntity },
    @Query() query: { page?: string; limit?: string; status?: string },
  ): Promise<Booking[]> {
    const { page, limit, status } = query;
    const options: any = { where: {} };
    if (limit) {
      options.take = parseInt(limit, 10);
      if (page) {
        options.skip = (parseInt(page, 10) - 1) * options.take;
      }
    }
    if (status) options.where.status = status;
    if (Object.keys(options.where).length === 0) delete options.where;

    return this.bookingsService.findUserBookings(req.user.id, options);
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.CLUB_OWNER, UserRole.ADMIN) // User can see own, ClubOwner their club's, Admin all
  @ApiOperation({ summary: 'Get a specific booking by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'ID of the booking' })
  @ApiResponse({ status: 200, description: 'Booking data.', type: Booking })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: UserEntity },
  ): Promise<Booking> {
    return this.bookingsService.findOneBookingOrFail(id, req.user.id, req.user.role);
  }

  @Patch(':id/cancel-by-user')
  @Roles(UserRole.USER, UserRole.ADMIN) // User can cancel their own, Admin can also use (though admin has other ways)
  @ApiOperation({ summary: 'Cancel a booking (User)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'ID of the booking to cancel' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully.', type: Booking })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., cannot cancel at this time).' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  cancelByUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: UserEntity },
  ): Promise<Booking> {
    return this.bookingsService.cancelBookingByUser(id, req.user);
  }

  // --- Admin / Club Owner specific endpoints for bookings ---

  @Get('club/:clubId')
  @UseGuards(RolesGuard) // RolesGuard is already part of @UseGuards at controller level, but explicit here for clarity
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all bookings for a specific club (Club Owner or Admin)' })
  @ApiParam({ name: 'clubId', type: 'string', format: 'uuid', description: 'ID of the club' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by booking status' })
  @ApiQuery({ name: 'date_from', required: false, type: String, format: 'date', description: 'Filter by booking date from (YYYY-MM-DD)'})
  @ApiQuery({ name: 'date_to', required: false, type: String, format: 'date', description: 'Filter by booking date to (YYYY-MM-DD)'})
  @ApiResponse({ status: 200, description: 'List of club bookings.', type: [Booking] })
  findClubBookings(
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Req() req: { user: UserEntity },
    @Query() query: { page?: string; limit?: string; status?: string; date_from?: string; date_to?: string },
  ): Promise<Booking[]> {
    const { page, limit, status, date_from, date_to } = query;
    const options: any = { where: {} };
     if (limit) {
      options.take = parseInt(limit, 10);
      if (page) {
        options.skip = (parseInt(page, 10) - 1) * options.take;
      }
    }
    if (status) options.where.status = status;
    if (date_from) {
        // options.where.booking_date = MoreThanOrEqual(date_from); // Requires TypeORM MoreThanOrEqual
    }
    if (date_to) {
        // options.where.booking_date = LessThanOrEqual(date_to); // Requires TypeORM LessThanOrEqual
    }
    // More complex date range filtering would be better in the service layer.
    if (Object.keys(options.where).length === 0) delete options.where;

    return this.bookingsService.findClubBookings(clubId, req.user, options);
  }

  @Patch('admin-manage/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update booking status or details (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'ID of the booking' })
  @ApiResponse({ status: 200, description: 'Booking updated by admin.', type: Booking })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  updateByAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Req() req: { user: UserEntity },
  ): Promise<Booking> {
    return this.bookingsService.updateBookingStatusByAdmin(id, updateBookingDto, req.user);
  }

  @Patch('admin-manage/:id/cancel-by-admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLUB_OWNER) // Allow Club Owner to cancel bookings for their club as well
  @ApiOperation({ summary: 'Cancel a booking (Admin or Club Owner for their club)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'ID of the booking to cancel' })
  @ApiBody({ schema: { properties: { cancellation_reason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully.', type: Booking })
  cancelByAdminOrClub(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('cancellation_reason') cancellation_reason: string,
    @Req() req: { user: UserEntity },
  ): Promise<Booking> {
    if (!cancellation_reason) throw new BadRequestException('دلیل لغو باید ارائه شود.');
    return this.bookingsService.cancelBookingByAdminOrClub(id, cancellation_reason, req.user);
  }
}
