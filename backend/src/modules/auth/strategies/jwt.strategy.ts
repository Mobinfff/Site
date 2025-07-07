import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../auth.service'; // Assuming JwtPayload is exported from AuthService
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService, // Inject AuthService to validate user
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Passport will handle expiration check
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<Partial<User>> {
    // The payload is the decoded JWT.
    // We can use this payload to fetch additional user information or perform other checks.
    // For now, we assume the payload itself is enough, or we can fetch the user from DB.

    const user = await this.authService.validateUserById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('کاربر نامعتبر یا یافت نشد.');
    }
    // The return value of this method will be attached to the request object as `req.user`
    // Return essential user info, excluding sensitive data like password
    return {
        id: user.id,
        phone_number: user.phone_number,
        role: user.role,
        // any other fields you want to attach to req.user
    };
  }
}
