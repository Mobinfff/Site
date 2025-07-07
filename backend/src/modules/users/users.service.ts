import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, creatorRole?: UserRole): Promise<User> {
    if (createUserDto.role === UserRole.ADMIN && creatorRole !== UserRole.ADMIN) {
      throw new ForbiddenException('شما مجاز به ایجاد کاربر با نقش ادمین نیستید.');
    }

    const existingUserByPhone = await this.usersRepository.findOneBy({ phone_number: createUserDto.phone_number });
    if (existingUserByPhone) {
      throw new BadRequestException('کاربری با این شماره موبایل قبلاً ثبت شده است.');
    }

    if (createUserDto.email) {
      const existingUserByEmail = await this.usersRepository.findOneBy({ email: createUserDto.email });
      if (existingUserByEmail) {
        throw new BadRequestException('کاربری با این ایمیل قبلاً ثبت شده است.');
      }
    }

    const user = this.usersRepository.create(createUserDto);

    if (createUserDto.password) {
      user.password = await this.hashPassword(createUserDto.password);
    }

    // New users created via this service (e.g. by an admin) can be set as phone_verified if a password is provided
    if (createUserDto.password && !createUserDto.phone_number.startsWith('otp_pending_')) { // Avoid for OTP flow if merged
        user.is_phone_verified = true;
    }


    try {
      await this.usersRepository.save(user);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as User;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new BadRequestException('شماره موبایل یا ایمیل قبلا استفاده شده است.');
      }
      throw new InternalServerErrorException('خطا در ایجاد کاربر.');
    }
  }

  async findAll(options?: FindManyOptions<User>): Promise<User[]> {
    const users = await this.usersRepository.find(options);
    return users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as User;
    });
  }

  async findOne(id: string, options?: FindOneOptions<User>): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id }, ...options });
    if (!user) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result as User;
  }

  async findOneOrFail(id: string, options?: FindOneOptions<User>): Promise<User> {
    const user = await this.findOne(id, options);
    if (!user) {
      throw new NotFoundException(`کاربری با شناسه '${id}' یافت نشد.`);
    }
    return user;
  }


  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const user = await this.usersRepository.findOneBy({ phone_number: phoneNumber });
     if (!user) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result as User;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser?: User): Promise<User> {
    const userToUpdate = await this.usersRepository.findOneBy({ id });
    if (!userToUpdate) {
      throw new NotFoundException(`کاربری با شناسه '${id}' یافت نشد.`);
    }

    // Authorization: Only admin can change role or update other users (unless it's self-update)
    if (currentUser && currentUser.id !== id && currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('شما مجاز به ویرایش اطلاعات این کاربر نیستید.');
    }
    if (updateUserDto.role && currentUser && currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('شما مجاز به تغییر نقش کاربر نیستید.');
    }
    // Prevent user from making themselves an admin unless they are already an admin
    if (updateUserDto.role === UserRole.ADMIN && currentUser && currentUser.role !== UserRole.ADMIN && id === currentUser.id) {
        throw new ForbiddenException('شما نمی‌توانید نقش خود را به ادمین تغییر دهید.');
    }


    if (updateUserDto.email && updateUserDto.email !== userToUpdate.email) {
      const existingUserByEmail = await this.usersRepository.findOne({ where: { email: updateUserDto.email } });
      if (existingUserByEmail && existingUserByEmail.id !== id) {
        throw new BadRequestException('این ایمیل توسط کاربر دیگری استفاده شده است.');
      }
    }

    if (updateUserDto.phone_number && updateUserDto.phone_number !== userToUpdate.phone_number) {
        const existingUserByPhone = await this.usersRepository.findOne({ where: { phone_number: updateUserDto.phone_number } });
        if (existingUserByPhone && existingUserByPhone.id !== id) {
            throw new BadRequestException('این شماره موبایل توسط کاربر دیگری استفاده شده است.');
        }
        // If phone number changes, it should be re-verified
        userToUpdate.is_phone_verified = false;
    }


    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }

    Object.assign(userToUpdate, updateUserDto);

    try {
      await this.usersRepository.save(userToUpdate);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = userToUpdate;
      return result as User;
    } catch (error) {
      if (error.code === '23505') {
         throw new BadRequestException('شماره موبایل یا ایمیل قبلا استفاده شده است.');
      }
      throw new InternalServerErrorException('خطا در به‌روزرسانی کاربر.');
    }
  }

  async remove(id: string, currentUser?: User): Promise<void> {
    const userToRemove = await this.usersRepository.findOneBy({ id });
    if (!userToRemove) {
      throw new NotFoundException(`کاربری با شناسه '${id}' یافت نشد.`);
    }

    if (currentUser && currentUser.id === id && currentUser.role === UserRole.ADMIN && userToRemove.role === UserRole.ADMIN) {
        // Check if this is the last admin
        const adminCount = await this.usersRepository.count({where: {role: UserRole.ADMIN}});
        if (adminCount <= 1) {
            throw new ForbiddenException('امکان حذف آخرین کاربر ادمین وجود ندارد.');
        }
    }


    // For soft delete, you would set an `is_deleted` flag or `deleted_at` timestamp
    // For hard delete:
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`کاربری با شناسه '${id}' یافت نشد (ممکن است همزمان حذف شده باشد).`);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
