import { Injectable, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions, MoreThanOrEqual, LessThanOrEqual, Not, In } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { User, UserRole } from '../../users/entities/user.entity';
import { Schedule, ScheduleStatus as ClubScheduleStatus } from '../../clubs/entities/schedule.entity';
import { Club, ClubStatus } from '../../clubs/entities/club.entity';
import { SchedulesService } from '../../clubs/services/schedules.service'; // To update occupancy
import { UpdateBookingDto } from '../dto/update-booking.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    private readonly schedulesService: SchedulesService,
  ) {}

  async createBooking(currentUser: User, createBookingDto: CreateBookingDto): Promise<Booking> {
    const { schedule_id, booking_date } = createBookingDto;

    const schedule = await this.scheduleRepository.findOne({
      where: { id: schedule_id },
      relations: ['club'], // Need club to check its status and for club_id in booking
    });

    if (!schedule) {
      throw new NotFoundException(`سانسی با شناسه '${schedule_id}' یافت نشد.`);
    }
    if (!schedule.is_active) {
      throw new BadRequestException('این سانس در حال حاضر فعال نیست و امکان رزرو وجود ندارد.');
    }
    if (schedule.schedule_status !== ClubScheduleStatus.OPEN) {
      throw new BadRequestException(`وضعیت این سانس '${schedule.schedule_status}' است و امکان رزرو وجود ندارد.`);
    }
    if (schedule.current_occupancy >= schedule.capacity) {
      throw new BadRequestException('ظرفیت این سانس تکمیل شده است.');
    }

    // Validate booking_date against schedule's valid_from, valid_until, and days_of_week
    const requestedBookingDate = new Date(booking_date);
    if (schedule.valid_from && requestedBookingDate < new Date(schedule.valid_from)) {
      throw new BadRequestException(`این سانس از تاریخ ${schedule.valid_from} معتبر است.`);
    }
    if (schedule.valid_until && requestedBookingDate > new Date(schedule.valid_until)) {
      throw new BadRequestException(`این سانس تا تاریخ ${schedule.valid_until} معتبر است.`);
    }
    const dayOfWeek = requestedBookingDate.getDay(); // 0 (Sunday) - 6 (Saturday)
    if (!schedule.days_of_week.includes(dayOfWeek) && !schedule.days_of_week.includes(this.getDayName(dayOfWeek))) {
      throw new BadRequestException(`این سانس در روز انتخابی (${this.getDayName(dayOfWeek)}) ارائه نمی‌شود.`);
    }

    // Check if club is active and approved
    const club = schedule.club; // Already loaded with relation
    if (!club) { // Should not happen if schedule has a valid club_id
        throw new InternalServerErrorException('اطلاعات باشگاه برای این سانس یافت نشد.');
    }
    if (!club.is_active || club.status !== ClubStatus.APPROVED) {
        throw new BadRequestException('امکان رزرو برای این باشگاه در حال حاضر وجود ندارد (باشگاه فعال یا تایید شده نیست).');
    }


    // Check for existing active booking by the same user for the same schedule on the same date
    const existingBooking = await this.bookingRepository.findOneBy({
      user_id: currentUser.id,
      schedule_id: schedule_id,
      booking_date: booking_date,
      status: Not(In([
          BookingStatus.CANCELLED_BY_USER,
          BookingStatus.CANCELLED_BY_CLUB,
          BookingStatus.CANCELLED_BY_ADMIN,
          BookingStatus.PAYMENT_FAILED,
          BookingStatus.REFUNDED,
      ]))
    });

    if (existingBooking) {
      throw new ConflictException('شما قبلاً این سانس را در این تاریخ رزرو کرده‌اید.');
    }

    const booking = this.bookingRepository.create({
      user_id: currentUser.id,
      user: currentUser,
      schedule_id: schedule_id,
      schedule: schedule,
      club_id: schedule.club_id, // Denormalize club_id from schedule
      club: club,
      booking_date: booking_date,
      total_price: schedule.price, // Price at the time of booking
      status: BookingStatus.PENDING_PAYMENT, // Initial status
    });

    try {
      const savedBooking = await this.bookingRepository.save(booking);
      // In a real scenario, you might not increment occupancy until payment is confirmed.
      // Or, implement a temporary hold mechanism.
      // For now, let's assume we increment on booking creation initiation.
      // await this.schedulesService.incrementOccupancy(schedule_id, schedule.club_id, requestedBookingDate);
      return savedBooking;
    } catch (error) {
      this.logger.error(`Failed to create booking for user ${currentUser.id}: ${error.message}`, error.stack);
      if (error.code === '23505') { // Unique constraint violation (though previous check should catch most)
        throw new ConflictException('رزرو مشابهی از قبل برای شما ثبت شده است.');
      }
      throw new InternalServerErrorException('خطا در ایجاد رزرو.');
    }
  }

  async findUserBookings(userId: string, options?: FindManyOptions<Booking>): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { user_id: userId, ...options?.where },
      relations: ['schedule', 'schedule.club', 'schedule.sport_type', ...(options?.relations || [])], // Include related data
      order: { booking_date: 'DESC', created_at: 'DESC', ...options?.order },
      ...options,
    });
  }

  async findClubBookings(clubId: string, currentUser: User, options?: FindManyOptions<Booking>): Promise<Booking[]> {
    const club = await this.clubRepository.findOneBy({id: clubId});
    if (!club) throw new NotFoundException(`باشگاه با شناسه ${clubId} یافت نشد.`);
    if (club.owner_id !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('شما مجاز به مشاهده رزروهای این باشگاه نیستید.');
    }

    return this.bookingRepository.find({
        where: { club_id: clubId, ...options?.where },
        relations: ['user', 'schedule', 'schedule.sport_type', ...(options?.relations || [])],
        order: { booking_date: 'DESC', created_at: 'DESC', ...options?.order },
        ...options,
    });
  }


  async findOneBooking(bookingId: string, userId?: string, userRole?: UserRole): Promise<Booking | null> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'schedule', 'schedule.club', 'schedule.sport_type'],
    });

    if (!booking) {
      return null;
    }

    // If userId is provided, check if the user is the owner of the booking or an admin
    if (userId && booking.user_id !== userId && userRole !== UserRole.ADMIN) {
      // If user is a club owner, check if the booking belongs to their club
      if (userRole === UserRole.CLUB_OWNER) {
        const club = await this.clubRepository.findOneBy({id: booking.club_id, owner_id: userId});
        if (!club) {
            throw new ForbiddenException('شما مجاز به مشاهده این رزرو نیستید.');
        }
      } else {
        throw new ForbiddenException('شما مجاز به مشاهده این رزرو نیستید.');
      }
    }
    return booking;
  }

  async findOneBookingOrFail(bookingId: string, userId?: string, userRole?: UserRole): Promise<Booking> {
    const booking = await this.findOneBooking(bookingId, userId, userRole);
    if (!booking) {
      throw new NotFoundException(`رزروی با شناسه '${bookingId}' یافت نشد.`);
    }
    return booking;
  }

  async cancelBookingByUser(bookingId: string, currentUser: User): Promise<Booking> {
    const booking = await this.findOneBookingOrFail(bookingId, currentUser.id, currentUser.role);

    if (booking.user_id !== currentUser.id) {
      throw new ForbiddenException('شما فقط می‌توانید رزروهای خود را لغو کنید.');
    }

    // TODO: Implement cancellation policy (e.g., cannot cancel X hours before schedule time)
    const now = new Date();
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.schedule.start_time}`);
    // Example: Cannot cancel if less than 2 hours to start time
    // if ((bookingDateTime.getTime() - now.getTime()) < (2 * 60 * 60 * 1000)) {
    //   throw new BadRequestException('امکان لغو رزرو در کمتر از 2 ساعت به شروع سانس وجود ندارد.');
    // }

    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(`امکان لغو این رزرو در وضعیت فعلی ('${booking.status}') وجود ندارد.`);
    }

    booking.status = BookingStatus.CANCELLED_BY_USER;
    booking.cancelled_at = new Date();
    // booking.cancellation_reason = "Cancelled by user"; // Optional

    try {
      const updatedBooking = await this.bookingRepository.save(booking);
      // Decrement occupancy only if it was confirmed or held capacity
      if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING_PAYMENT) {
        // (Assuming PENDING_PAYMENT also held a spot or was counted)
        await this.schedulesService.decrementOccupancy(booking.schedule_id, booking.club_id, new Date(booking.booking_date));
      }
      // TODO: Trigger refund process if applicable (e.g., if status was CONFIRMED)
      return updatedBooking;
    } catch (error) {
      this.logger.error(`Failed to cancel booking ${bookingId} by user ${currentUser.id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('خطا در لغو رزرو.');
    }
  }

  // Method for Admin or Club Owner to cancel a booking
  async cancelBookingByAdminOrClub(bookingId: string, cancellationReason: string, canceller: User): Promise<Booking> {
    const booking = await this.findOneBookingOrFail(bookingId); // No user check here, role check below

    if (canceller.role === UserRole.CLUB_OWNER) {
        if (booking.club_id !== canceller.id) { // This is not correct, club.owner_id should be checked
            const club = await this.clubRepository.findOneBy({id: booking.club_id, owner_id: canceller.id});
            if (!club) {
                 throw new ForbiddenException('شما به عنوان مالک باشگاه مجاز به لغو این رزرو نیستید.');
            }
        }
    } else if (canceller.role !== UserRole.ADMIN) {
        throw new ForbiddenException('شما مجاز به لغو این رزرو نیستید.');
    }

    if (booking.status === BookingStatus.CANCELLED_BY_USER ||
        booking.status === BookingStatus.CANCELLED_BY_CLUB ||
        booking.status === BookingStatus.CANCELLED_BY_ADMIN ||
        booking.status === BookingStatus.COMPLETED ||
        booking.status === BookingStatus.REFUNDED) {
      throw new BadRequestException(`امکان لغو این رزرو در وضعیت فعلی ('${booking.status}') وجود ندارد.`);
    }

    booking.status = canceller.role === UserRole.ADMIN ? BookingStatus.CANCELLED_BY_ADMIN : BookingStatus.CANCELLED_BY_CLUB;
    booking.cancelled_at = new Date();
    booking.cancellation_reason = cancellationReason;

    try {
      const updatedBooking = await this.bookingRepository.save(booking);
      if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING_PAYMENT) {
        await this.schedulesService.decrementOccupancy(booking.schedule_id, booking.club_id, new Date(booking.booking_date));
      }
      // TODO: Trigger refund process if status was CONFIRMED
      // TODO: Notify user about cancellation
      return updatedBooking;
    } catch (error) {
      this.logger.error(`Failed to cancel booking ${bookingId} by ${canceller.role} ${canceller.id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('خطا در لغو رزرو.');
    }
  }


  // Called by PaymentService after successful payment
  async confirmBookingPayment(bookingId: string, paymentGateway: string, transactionId: string): Promise<Booking> {
    const booking = await this.findOneBookingOrFail(bookingId);
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      this.logger.warn(`Attempt to confirm payment for booking ${bookingId} which is not PENDING_PAYMENT (current status: ${booking.status})`);
      // Decide if this is an error or should be handled (e.g., if already confirmed)
      if(booking.status === BookingStatus.CONFIRMED) return booking; // Idempotent
      throw new BadRequestException(`وضعیت این رزرو '${booking.status}' است و امکان تایید پرداخت وجود ندارد.`);
    }

    booking.status = BookingStatus.CONFIRMED;
    booking.payment_gateway = paymentGateway;
    booking.payment_transaction_id = transactionId;
    booking.payment_completed_at = new Date();

    try {
      // Increment occupancy in the schedule
      await this.schedulesService.incrementOccupancy(booking.schedule_id, booking.club_id, new Date(booking.booking_date));
      const savedBooking = await this.bookingRepository.save(booking);
      // TODO: Send notification to user and club owner
      return savedBooking;
    } catch (error) {
      this.logger.error(`Failed to confirm payment for booking ${bookingId}: ${error.message}`, error.stack);
      // Potentially try to revert occupancy increment if that part failed after this save.
      throw new InternalServerErrorException('خطا در تایید پرداخت رزرو.');
    }
  }

  async handleFailedPayment(bookingId: string): Promise<Booking> {
    const booking = await this.findOneBookingOrFail(bookingId);
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      this.logger.warn(`Attempt to mark payment failed for booking ${bookingId} not in PENDING_PAYMENT (status: ${booking.status})`);
       if(booking.status === BookingStatus.PAYMENT_FAILED) return booking; // Idempotent
      // If it was already confirmed or cancelled, probably shouldn't change it here.
      return booking;
    }

    booking.status = BookingStatus.PAYMENT_FAILED;
    // No need to decrement occupancy if it was only incremented on CONFIRMED status
    // If PENDING_PAYMENT also held a spot and incremented occupancy, then decrement here.
    // await this.schedulesService.decrementOccupancy(booking.schedule_id, booking.club_id, new Date(booking.booking_date));

    try {
      return await this.bookingRepository.save(booking);
    } catch (error) {
        this.logger.error(`Failed to handle failed payment for booking ${bookingId}: ${error.message}`, error.stack);
        throw new InternalServerErrorException('خطا در پردازش پرداخت ناموفق.');
    }
  }

  async updateBookingStatusByAdmin(bookingId: string, updateDto: UpdateBookingDto, adminUser: User): Promise<Booking> {
    if (adminUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('فقط ادمین مجاز به تغییر مستقیم وضعیت رزرو است.');
    }
    const booking = await this.findOneBookingOrFail(bookingId);

    // More sophisticated status transition logic can be added here
    // For example, an admin cannot change a CANCELLED_BY_USER booking back to CONFIRMED without a new payment flow.

    Object.assign(booking, updateDto); // Apply status and potentially cancellation_reason, payment_transaction_id

    try {
        return await this.bookingRepository.save(booking);
    } catch (error) {
        this.logger.error(`Admin failed to update booking ${bookingId}: ${error.message}`, error.stack);
        throw new InternalServerErrorException('خطا در به‌روزرسانی وضعیت رزرو توسط ادمین.');
    }
  }

  private getDayName(dayIndex: number): string {
    return ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][dayIndex];
  }
}
