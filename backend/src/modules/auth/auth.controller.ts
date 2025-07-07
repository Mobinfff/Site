import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // Will be created later
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() requestOtpDto: RequestOtpDto): Promise<{ message: string }> {
    await this.authService.requestOtp(requestOtpDto.phone_number);
    return { message: 'OTP has been sent successfully.' };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<{ access_token: string, refresh_token: string, user: Partial<User> }> {
    const result = await this.authService.verifyOtp(verifyOtpDto.phone_number, verifyOtpDto.code);
    return result;
  }

  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refresh_token') refreshToken: string): Promise<{ access_token: string }> {
    const accessToken = await this.authService.refreshAccessToken(refreshToken);
    return { access_token: accessToken };
  }

  @UseGuards(JwtAuthGuard) // This guard will protect the route
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req): Promise<User> {
    // req.user is populated by JwtStrategy after validating the token
    // We might want to fetch the full user profile from the database
    // if req.user only contains the payload (e.g., userId, phone_number)
    return this.authService.getProfile(req.user.userId);
  }

  // TODO: Add endpoints for login with password (for admin/club_owner if needed)
  // TODO: Add endpoint for logout (potentially blacklisting tokens)
}
