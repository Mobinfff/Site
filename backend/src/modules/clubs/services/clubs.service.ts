import { Injectable, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions, In, IsNull, Not } from 'typeorm';
import { Club, ClubStatus } from '../entities/club.entity';
import { ClubImage } from '../entities/club-image.entity';
import { CreateClubDto } from '../dto/create-club.dto';
import { UpdateClubDto } from '../dto/update-club.dto';
import { ApproveClubDto } from '../dto/approve-club.dto';
import { User, UserRole } from '../../users/entities/user.entity';
import { SportTypesService } from './sport-types.service';
import { ClubFacilitiesService } from './club-facilities.service';
// import { UsersService } from '../../users/users.service'; // If needed for owner validation

@Injectable()
export class ClubsService {
  private readonly logger = new Logger(ClubsService.name);

  constructor(
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(ClubImage)
    private readonly clubImageRepository: Repository<ClubImage>,
    private readonly sportTypesService: SportTypesService,
    private readonly clubFacilitiesService: ClubFacilitiesService,
    // private readonly usersService: UsersService, // Optional: if you need to fetch full owner object or validate
  ) {}

  async create(createClubDto: CreateClubDto, owner: User): Promise<Club> {
    if (owner.role !== UserRole.CLUB_OWNER && owner.role !== UserRole.ADMIN) {
      throw new ForbiddenException('فقط باشگاه‌داران یا ادمین‌ها می‌توانند باشگاه جدید ایجاد کنند.');
    }

    const newClub = this.clubRepository.create({
      ...createClubDto,
      owner_id: owner.id,
      owner: owner, // Assign the user object directly if relation is set up for it
      status: owner.role === UserRole.ADMIN ? ClubStatus.APPROVED : ClubStatus.PENDING_APPROVAL, // Admin created clubs are auto-approved
      images: [], // Initialize as empty, will be populated below
      facilities: [],
      sport_types: [],
    });

    // Handle facilities
    if (createClubDto.facility_ids && createClubDto.facility_ids.length > 0) {
      const facilities = await this.clubFacilitiesService.findByIds(createClubDto.facility_ids);
      if (facilities.length !== createClubDto.facility_ids.length) {
        throw new BadRequestException('یک یا چند شناسه امکانات نامعتبر است.');
      }
      newClub.facilities = facilities;
    }

    // Handle sport types
    if (createClubDto.sport_type_ids && createClubDto.sport_type_ids.length > 0) {
      const sportTypes = await this.sportTypesService.findByIds(createClubDto.sport_type_ids);
      if (sportTypes.length !== createClubDto.sport_type_ids.length) {
        throw new BadRequestException('یک یا چند شناسه نوع ورزش نامعتبر است.');
      }
      newClub.sport_types = sportTypes;
    }

    // Note: Club images from DTO are processed after club is initially saved or within a transaction.
    // For simplicity here, we'll save the club first, then images.
    // A transaction would be better for atomicity.

    try {
      const savedClub = await this.clubRepository.save(newClub);

      // Handle images from DTO
      if (createClubDto.images && createClubDto.images.length > 0) {
        const imageEntities = createClubDto.images.map(imgDto =>
          this.clubImageRepository.create({
            ...imgDto,
            club_id: savedClub.id,
          })
        );
        await this.clubImageRepository.save(imageEntities);
        // Re-fetch club to include images if not handled by cascades or eager loading correctly
        return this.findOneOrFail(savedClub.id, { relations: ['images', 'facilities', 'sport_types', 'owner'] });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { owner: clubOwner, ...resultClub } = savedClub; // Avoid returning full owner object with password
      return { ...resultClub, owner: { id: clubOwner.id, phone_number: clubOwner.phone_number, first_name: clubOwner.first_name, last_name: clubOwner.last_name } } as Club;

    } catch (error) {
      this.logger.error(`Failed to create club for owner ${owner.id}: ${error.message}`, error.stack);
      // TODO: More specific error handling, e.g., unique constraints
      throw new InternalServerErrorException('خطا در ایجاد باشگاه.');
    }
  }

  async findAll(options?: FindManyOptions<Club>): Promise<Club[]> {
    // Default to load owner basic info, facilities, sport_types, and cover image.
    const defaultOptions: FindManyOptions<Club> = {
        relations: ['owner', 'facilities', 'sport_types', 'images'],
        ...options,
        where: {
            ...options?.where,
            // status: ClubStatus.APPROVED, // Example: only show approved clubs by default for public list
        }
    };
    const clubs = await this.clubRepository.find(defaultOptions);
    return clubs.map(club => this.transformClubResponse(club));
  }

  async findOne(id: string, options?: FindOneOptions<Club>): Promise<Club | null> {
    const club = await this.clubRepository.findOne({
        where: { id },
        relations: ['owner', 'facilities', 'sport_types', 'images', 'schedules'], // Load all common relations for detail view
        ...options
    });
    return club ? this.transformClubResponse(club) : null;
  }

  async findOneOrFail(id: string, options?: FindOneOptions<Club>): Promise<Club> {
    const club = await this.findOne(id, options);
    if (!club) {
      throw new NotFoundException(`باشگاهی با شناسه '${id}' یافت نشد.`);
    }
    return club;
  }

  async update(id: string, updateClubDto: UpdateClubDto, currentUser: User): Promise<Club> {
    const club = await this.findOneOrFail(id, { relations: ['owner', 'facilities', 'sport_types', 'images'] });

    // Authorization: Only owner or admin can update
    if (club.owner_id !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('شما مجاز به ویرایش این باشگاه نیستید.');
    }

    // Admin-only fields (like status, is_featured, rejection_reason)
    if (currentUser.role !== UserRole.ADMIN) {
      if (updateClubDto.status && updateClubDto.status !== club.status) {
        throw new ForbiddenException('شما مجاز به تغییر وضعیت باشگاه نیستید.');
      }
      delete updateClubDto.is_featured; // Non-admins cannot change is_featured
      delete updateClubDto.rejection_reason;
    }

    // Handle facilities update
    if (updateClubDto.facility_ids) {
        if(updateClubDto.facility_ids.length === 0) {
            club.facilities = [];
        } else {
            const facilities = await this.clubFacilitiesService.findByIds(updateClubDto.facility_ids);
            if (facilities.length !== updateClubDto.facility_ids.length) {
                throw new BadRequestException('یک یا چند شناسه امکانات نامعتبر است.');
            }
            club.facilities = facilities;
        }
    }

    // Handle sport types update
    if (updateClubDto.sport_type_ids) {
        if(updateClubDto.sport_type_ids.length === 0) {
            club.sport_types = [];
        } else {
            const sportTypes = await this.sportTypesService.findByIds(updateClubDto.sport_type_ids);
            if (sportTypes.length !== updateClubDto.sport_type_ids.length) {
                throw new BadRequestException('یک یا چند شناسه نوع ورزش نامعتبر است.');
            }
            club.sport_types = sportTypes;
        }
    }

    // Handle images update (simple replacement for now, better with dedicated endpoints)
    if (updateClubDto.images) {
        // Delete existing images
        await this.clubImageRepository.delete({ club_id: club.id });
        // Add new images
        const imageEntities = updateClubDto.images.map(imgDto =>
          this.clubImageRepository.create({
            ...imgDto,
            club_id: club.id,
          })
        );
        await this.clubImageRepository.save(imageEntities);
        // club.images = savedImages; // This won't reflect immediately without re-fetch or proper cascade.
    }


    // Merge other updatable fields
    const { facility_ids, sport_type_ids, images, ...otherUpdateData } = updateClubDto;
    Object.assign(club, otherUpdateData);

    try {
      const updatedClub = await this.clubRepository.save(club);
      // Re-fetch to get the updated relations correctly, especially after image changes
      return this.findOneOrFail(updatedClub.id, { relations: ['owner', 'facilities', 'sport_types', 'images', 'schedules'] });
    } catch (error) {
      this.logger.error(`Failed to update club ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('خطا در به‌روزرسانی باشگاه.');
    }
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const club = await this.findOneOrFail(id, { relations: ['owner'] });

    if (club.owner_id !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('شما مجاز به حذف این باشگاه نیستید.');
    }

    // Soft delete is preferred: club.status = ClubStatus.PERMANENTLY_CLOSED; club.is_active = false; await this.clubRepository.save(club);
    // For hard delete:
    const result = await this.clubRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`باشگاهی با شناسه '${id}' یافت نشد (ممکن است همزمان حذف شده باشد).`);
    }
  }

  async approveOrReject(id: string, approveDto: ApproveClubDto, adminUser: User): Promise<Club> {
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('فقط ادمین‌ها می‌توانند وضعیت باشگاه را تغییر دهند.');
    }
    const club = await this.findOneOrFail(id);

    if (club.status !== ClubStatus.PENDING_APPROVAL && club.status !== ClubStatus.REJECTED && approveDto.status === ClubStatus.APPROVED) {
        // Allow re-approval of rejected clubs, or if admin wants to approve an already approved one (idempotent)
    } else if (club.status !== ClubStatus.PENDING_APPROVAL && club.status !== ClubStatus.APPROVED && approveDto.status === ClubStatus.REJECTED) {
        // Allow re-rejection of approved clubs, or if admin wants to reject an already rejected one (idempotent)
    } else if (club.status === approveDto.status) {
        // If status is already what is being set, just return the club.
        this.logger.log(`Club ${id} is already in status ${approveDto.status}. No change made.`);
        // Optionally update comment if provided
        if (approveDto.admin_comment) club.rejection_reason = approveDto.admin_comment;
        await this.clubRepository.save(club);
        return this.transformClubResponse(club);
    }


    club.status = approveDto.status;
    if (approveDto.status === ClubStatus.REJECTED) {
      club.rejection_reason = approveDto.admin_comment || 'دلیل خاصی توسط ادمین ذکر نشده است.';
      club.is_active = false; // Typically deactivate if rejected
    } else if (approveDto.status === ClubStatus.APPROVED) {
      club.rejection_reason = null; // Clear rejection reason on approval
      club.is_active = true; // Activate on approval
    }

    try {
      const updatedClub = await this.clubRepository.save(club);
      // TODO: Send notification to club owner
      return this.transformClubResponse(updatedClub);
    } catch (error) {
      this.logger.error(`Failed to ${approveDto.status} club ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('خطا در تغییر وضعیت باشگاه.');
    }
  }

  // Helper to remove sensitive data from owner and ensure consistent response structure
  private transformClubResponse(club: Club): Club {
    if (club.owner) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, created_at, updated_at, is_active, is_phone_verified, role, ...ownerDetails } = club.owner;
        club.owner = ownerDetails as User;
    }
    // Ensure images are sorted by display_order, then by is_cover
    if (club.images) {
        club.images.sort((a, b) => {
            if (a.is_cover !== b.is_cover) {
                return a.is_cover ? -1 : 1;
            }
            return (a.display_order || 0) - (b.display_order || 0);
        });
    }
    return club;
  }

  // --- Methods for managing club images (to be called by dedicated endpoints later) ---

  async addImageToClub(clubId: string, imageUrl: string, altText?: string, isCover?: boolean, displayOrder?: number, currentUser?: User): Promise<ClubImage> {
    const club = await this.findOneOrFail(clubId, {relations: ['owner']});
    if (currentUser && club.owner_id !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('شما مجاز به افزودن تصویر به این باشگاه نیستید.');
    }

    if (isCover) { // If setting a new cover, unset previous cover images for this club
        await this.clubImageRepository.update({ club_id: clubId, is_cover: true }, { is_cover: false });
    }

    const newImage = this.clubImageRepository.create({
        club_id: clubId,
        image_url: imageUrl,
        alt_text: altText,
        is_cover: isCover || false,
        display_order: displayOrder || 0,
    });
    try {
        return await this.clubImageRepository.save(newImage);
    } catch(error) {
        this.logger.error(`Failed to add image to club ${clubId}: ${error.message}`, error.stack);
        throw new InternalServerErrorException('خطا در افزودن تصویر به باشگاه.');
    }
  }

  async updateClubImage(clubId: string, imageId: string, updateData: Partial<Pick<ClubImage, 'alt_text' | 'is_cover' | 'display_order'>>, currentUser?: User): Promise<ClubImage> {
    const club = await this.findOneOrFail(clubId, {relations: ['owner']});
    if (currentUser && club.owner_id !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('شما مجاز به ویرایش تصاویر این باشگاه نیستید.');
    }

    const image = await this.clubImageRepository.findOneBy({id: imageId, club_id: clubId});
    if (!image) {
        throw new NotFoundException(`تصویری با شناسه '${imageId}' برای باشگاه '${clubId}' یافت نشد.`);
    }

    if (updateData.is_cover && !image.is_cover) { // If setting this image as cover
        // Unset other cover images for this club
        await this.clubImageRepository.update({ club_id: clubId, is_cover: true }, { is_cover: false });
    }

    Object.assign(image, updateData);
    try {
        return await this.clubImageRepository.save(image);
    } catch(error) {
        this.logger.error(`Failed to update image ${imageId} for club ${clubId}: ${error.message}`, error.stack);
        throw new InternalServerErrorException('خطا در ویرایش تصویر باشگاه.');
    }
  }

  async deleteClubImage(clubId: string, imageId: string, currentUser?: User): Promise<void> {
    const club = await this.findOneOrFail(clubId, {relations: ['owner']});
     if (currentUser && club.owner_id !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('شما مجاز به حذف تصاویر این باشگاه نیستید.');
    }
    const image = await this.clubImageRepository.findOneBy({id: imageId, club_id: clubId});
    if (!image) {
        throw new NotFoundException(`تصویری با شناسه '${imageId}' برای باشگاه '${clubId}' یافت نشد.`);
    }
    // TODO: Delete actual file from storage (Cloudinary/S3) if applicable

    const result = await this.clubImageRepository.delete(imageId);
    if (result.affected === 0) {
        throw new NotFoundException(`تصویری با شناسه '${imageId}' یافت نشد (ممکن است همزمان حذف شده باشد).`);
    }
  }
}
