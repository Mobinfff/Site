import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module'; // For JwtAuthGuard and RolesGuard if they are exported from AuthModule

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule), // Use forwardRef if AuthModule imports UsersModule to break circular dependency
                                 // Or ensure AuthModule exports necessary guards and UsersModule imports AuthModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule], // Export UsersService if other modules need it, and TypeOrmModule for User entity
})
export class UsersModule {}
