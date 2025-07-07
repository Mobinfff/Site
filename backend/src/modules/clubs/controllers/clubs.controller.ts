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
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express'; // For single file upload if needed directly on club
import { ClubsService } from '../services/clubs.service';
import { CreateClubDto } from '../dto/create-club.dto';
import { UpdateClubDto } from '../dto/update-club.dto';
import { ApproveClubDto } from '../dto/approve-club.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole, User as UserEntity } from '../../users/entities/user.entity';
import { Club, ClubStatus } from '../entities/club.entity';
import { ClubImage } from '../entities/club-image.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
// DTO for adding a single image (example, can be more complex)
import { CreateClubImageDto } from '../dto/create-club-image.dto';
import { UpdateClubImageDto } from '../dto/update-club-image.dto';


@ApiTags('Clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  // --- Public Endpoints ---
  @Get()
  @ApiOperation({ summary: 'Get a list of approved clubs (Public)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by club name' })
  @ApiQuery({ name: 'sport_type_id', required: false, type: Number, description: 'Filter by sport type ID' })
  @ApiQuery({ name: 'facility_id', required: false, type: Number, description: 'Filter by facility ID' })
  @ApiQuery({ name: 'is_featured', required: false, type: Boolean, description: 'Filter featured clubs' })
  @ApiResponse({ status: 200, description: 'List of approved clubs.', type: [Club] })
  findAllApproved(@Query() query: any): Promise<Club[]> {
    const { page, limit, name, sport_type_id, facility_id, is_featured, ...filters } = query;
    const options: any = { where: { status: ClubStatus.APPROVED, is_active: true } }; // Default to approved and active
    if (limit) {
      options.take = parseInt(limit, 10);
      if (page) {
        options.skip = (parseInt(page, 10) - 1) * options.take;
      }
    }
    if (name) {
        // options.where.name = Like(`%${name}%`); // Requires TypeORM Like or custom query in service
    }
    if (is_featured !== undefined) options.where.is_featured = (is_featured === 'true');
    // TODO: Add filtering by sport_type_id and facility_id (requires join and where clause in service)
    // For now, these filters are illustrative.
    return this.clubsService.findAll(options);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get club details by ID (Public)' })
  @ApiResponse({ status: 200, description: 'Club data.', type: Club })
  @ApiResponse({ status: 404, description: 'Club not found or not approved.' })
  async findOnePublic(@Param('id', ParseUUIDPipe) id: string): Promise<Club> {
    const club = await this.clubsService.findOneOrFail(id);
    // For public view, only show if approved, or if user is owner/admin (handled by service or specific endpoint)
    if (club.status !== ClubStatus.APPROVED && club.status !== ClubStatus.TEMPORARILY_CLOSED) {
        // This check could also be inside the service's findOneOrFail for public context
        throw new NotFoundException(`باشگاهی با شناسه '${id}' یافت نشد یا در وضعیت نمایش عمومی نیست.`);
    }
    return club;
  }

  // --- Authenticated Endpoints ---
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new club (Club Owner or Admin)' })
  @ApiResponse({ status: 201, description: 'Club created successfully.', type: Club })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createClubDto: CreateClubDto, @Req() req: { user: UserEntity }): Promise<Club> {
    return this.clubsService.create(createClubDto, req.user);
  }

  @Get('my-clubs') // Club owner getting their own clubs
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get clubs owned by the current user (Club Owner or Admin)' })
  @ApiResponse({ status: 200, description: 'List of owned clubs.', type: [Club] })
  async findMyClubs(@Req() req: { user: UserEntity }, @Query() query: any): Promise<Club[]> {
    const { page, limit } = query;
    const options: any = { where: { owner_id: req.user.id } };
     if (limit) {
      options.take = parseInt(limit, 10);
      if (page) {
        options.skip = (parseInt(page, 10) - 1) * options.take;
      }
    }
    return this.clubsService.findAll(options);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a club (Club Owner or Admin)' })
  @ApiResponse({ status: 200, description: 'Club updated successfully.', type: Club })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Club not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClubDto: UpdateClubDto,
    @Req() req: { user: UserEntity },
  ): Promise<Club> {
    return this.clubsService.update(id, updateClubDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a club (Club Owner or Admin)' })
  @ApiResponse({ status: 204, description: 'Club deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Club not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: { user: UserEntity }): Promise<void> {
    return this.clubsService.remove(id, req.user);
  }

  // --- Admin Specific Endpoints for Clubs ---
  @Get('admin/all') // Get all clubs regardless of status (for Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all clubs (Admin only, any status)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ClubStatus })
  @ApiResponse({ status: 200, description: 'List of all clubs.', type: [Club] })
  findAllForAdmin(@Query() query: any): Promise<Club[]> {
    const { page, limit, status, ...filters } = query;
    const options: any = { where: {} };
     if (limit) {
      options.take = parseInt(limit, 10);
      if (page) {
        options.skip = (parseInt(page, 10) - 1) * options.take;
      }
    }
    if (status) options.where.status = status;
    // Add other filters if needed
    return this.clubsService.findAll(options);
  }

  @Patch('admin/approve/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve or Reject a club (Admin only)' })
  @ApiResponse({ status: 200, description: 'Club status updated.', type: Club })
  @ApiResponse({ status: 404, description: 'Club not found.' })
  approveOrRejectClub(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approveClubDto: ApproveClubDto,
    @Req() req: { user: UserEntity },
  ): Promise<Club> {
    return this.clubsService.approveOrReject(id, approveClubDto, req.user);
  }

  // --- Club Image Management Endpoints ---
  // These align with the feedback to have separate endpoints for image management.

  @Post(':clubId/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add an image to a club (Club Owner or Admin)' })
  // @ApiConsumes('multipart/form-data') // If uploading actual files
  // @UseInterceptors(FileInterceptor('file')) // Example for file upload
  @ApiResponse({ status: 201, description: 'Image added successfully.', type: ClubImage })
  async addImage(
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Body() createImageDto: CreateClubImageDto, // DTO containing image_url and other metadata
    // @UploadedFile( // Example if using file uploads
    //   new ParseFilePipe({
    //     validators: [
    //       new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
    //       new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
    //     ],
    //     fileIsRequired: true,
    //   }),
    // ) file: Express.Multer.File, // Requires `npm install --save-dev @types/multer`
    @Req() req: { user: UserEntity },
  ): Promise<ClubImage> {
    // If `file` is uploaded, you'd first upload it to Cloudinary/S3, get the URL, then pass to service.
    // For now, assuming createImageDto.image_url is provided directly (e.g., from a client-side upload to S3)
    return this.clubsService.addImageToClub(
        clubId,
        createImageDto.image_url,
        createImageDto.alt_text,
        createImageDto.is_cover,
        createImageDto.display_order,
        req.user
    );
  }

  @Patch(':clubId/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an image for a club (Club Owner or Admin)' })
  @ApiResponse({ status: 200, description: 'Image updated successfully.', type: ClubImage })
  async updateImage(
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() updateImageDto: UpdateClubImageDto,
    @Req() req: { user: UserEntity },
  ): Promise<ClubImage> {
    return this.clubsService.updateClubImage(clubId, imageId, updateImageDto, req.user);
  }

  @Delete(':clubId/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an image from a club (Club Owner or Admin)' })
  @ApiResponse({ status: 204, description: 'Image deleted successfully.' })
  async deleteImage(
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Req() req: { user: UserEntity },
  ): Promise<void> {
    return this.clubsService.deleteClubImage(clubId, imageId, req.user);
  }

}
