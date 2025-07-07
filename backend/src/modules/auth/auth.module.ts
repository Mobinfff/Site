import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Otp } from './entities/otp.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
// import { UsersModule } from '../users/users.module'; // Import UsersModule if UsersService is needed here

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Otp]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME', '1h'),
        },
      }),
    }),
    ConfigModule, // Ensure ConfigService is available
    // UsersModule, // If you need to inject UsersService, import its module
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // JwtStrategy should be a provider
  exports: [AuthService, JwtModule, PassportModule, JwtStrategy], // Export JwtStrategy and PassportModule if used in other modules' guards
})
export class AuthModule {}
