import { Injectable, UnauthorizedException, Logger, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from '../users/entities/user.entity';
import { Otp } from './entities/otp.entity';
// import { UsersService } from '../users/users.service'; // May not be needed if user creation is handled here

export interface JwtPayload {
  userId: string;
  phone_number: string;
  role: UserRole;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  user: Partial<User>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Otp)
    private otpsRepository: Repository<Otp>,
    private jwtService: JwtService,
    private configService: ConfigService,
    // private usersService: UsersService, // Inject if complex user logic is in UsersService
  ) {}

  private generateOtpCode(length: number = 6): string {
    // Generate a simple numeric OTP
    const characters = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.logger.log(`Generated OTP: ${result}`); // For testing, remove in production
    return result;
  }

  async requestOtp(phoneNumber: string): Promise<Otp> {
    const otpCode = this.generateOtpCode();
    const otpExpiryMinutes = 5; // OTP valid for 5 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + otpExpiryMinutes);

    // Invalidate previous active OTPs for this phone number
    await this.otpsRepository.update({ phone_number: phoneNumber, is_used: false }, { is_used: true });

    const otp = this.otpsRepository.create({
      phone_number: phoneNumber,
      code: otpCode, // In a real app, OTP should be hashed or managed securely
      expires_at: expiresAt,
      is_used: false,
    });

    try {
      await this.otpsRepository.save(otp);
      // TODO: Integrate with an actual SMS service here
      this.logger.log(`OTP for ${phoneNumber}: ${otpCode} (Expires at: ${expiresAt.toISOString()})`);
      return otp;
    } catch (error) {
      this.logger.error(`Failed to save OTP for ${phoneNumber}`, error.stack);
      throw new InternalServerErrorException('Failed to request OTP.');
    }
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<TokenResponse> {
    const otpRecord = await this.otpsRepository.findOne({
      where: {
        phone_number: phoneNumber,
        code: code, // Direct comparison for simplicity. Consider hashing in a real app.
        is_used: false,
      },
      order: { created_at: 'DESC' }, // Get the latest OTP if multiple exist (though prior ones should be invalidated)
    });

    if (!otpRecord) {
      throw new UnauthorizedException('کد OTP نامعتبر است.');
    }

    if (otpRecord.expires_at < new Date()) {
      otpRecord.is_used = true; // Mark as used even if expired
      await this.otpsRepository.save(otpRecord);
      throw new UnauthorizedException('کد OTP منقضی شده است.');
    }

    otpRecord.is_used = true;
    await this.otpsRepository.save(otpRecord);

    let user = await this.usersRepository.findOneBy({ phone_number: phoneNumber });

    if (!user) {
      // Create a new user if one doesn't exist
      user = this.usersRepository.create({
        phone_number: phoneNumber,
        is_phone_verified: true,
        role: UserRole.USER, // Default role
        is_active: true,
      });
      try {
        await this.usersRepository.save(user);
      } catch (error) {
        this.logger.error(`Failed to create user ${phoneNumber}`, error.stack);
        if (error.code === '23505') { // Unique constraint violation
            throw new BadRequestException('کاربری با این شماره موبایل یا ایمیل قبلا ثبت نام کرده است.');
        }
        throw new InternalServerErrorException('خطا در ایجاد کاربر جدید.');
      }
    } else {
        if (!user.is_phone_verified) {
            user.is_phone_verified = true;
            await this.usersRepository.save(user);
        }
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: User): Promise<TokenResponse> {
    const payload: JwtPayload = {
      userId: user.id,
      phone_number: user.phone_number,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'), // Consider a different secret or strategy for refresh tokens
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
    });

    // For security, you might want to store refresh tokens in the database
    // and associate them with the user. For simplicity, we're not doing that here.

    const { password, ...userResult } = user; // Exclude password from the response

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: userResult,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'), // Use the same secret used to sign it
      });

      // Here you might want to check if the refresh token is blacklisted or still valid in DB
      const user = await this.usersRepository.findOneBy({ id: payload.userId });
      if (!user || !user.is_active) {
        throw new UnauthorizedException('دسترسی نامعتبر یا کاربر غیرفعال است.');
      }

      // User is valid, issue a new access token
      const newPayload: JwtPayload = { userId: user.id, phone_number: user.phone_number, role: user.role };
      return this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
      });
    } catch (error) {
      this.logger.error('Refresh token validation failed', error.stack);
      throw new UnauthorizedException('نشست شما نامعتبر است، لطفاً دوباره وارد شوید.');
    }
  }

  async validateUserById(userId: string): Promise<User | null> {
    const user = await this.usersRepository.findOneBy({ id: userId, is_active: true });
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user; // Never return password
      return result as User;
    }
    return null;
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('کاربر یافت نشد.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result as User;
  }

  // Placeholder for password hashing (can be moved to a helper or user service)
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(plainPassword: string, hashedPassword?: string): Promise<boolean> {
    if (!hashedPassword) return false;
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
