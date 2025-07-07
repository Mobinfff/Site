import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
// It's good practice to specify entities directly if not using autoLoadEntities
// For now, we'll let autoLoadEntities handle it, but for production, explicit is better.
// import { User } from '../modules/users/entities/user.entity';
// import { Otp } from '../modules/auth/entities/otp.entity';
// ... other entities

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // entities: [User, Otp, /* ... other entities */], // Explicitly list entities
  entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Or use path for auto-loading (dev)
  synchronize: process.env.NODE_ENV === 'development', // Shouldn't be true in production - use migrations
  logging: process.env.NODE_ENV === 'development' ? 'all' : ['error'], // Log all queries in dev
  migrationsTableName: 'migrations',
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  // cli: { // Not needed here, but useful for package.json script
  //   migrationsDir: 'src/database/migrations',
  // },
};

// For use with TypeOrmModule.forRootAsync
export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
    return {
      type: 'postgres',
      host: configService.get<string>('DB_HOST'),
      port: configService.get<number>('DB_PORT'),
      username: configService.get<string>('DB_USERNAME'),
      password: configService.get<string>('DB_PASSWORD'),
      database: configService.get<string>('DB_DATABASE'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      // In production, synchronize should be false and migrations should be used.
      synchronize: configService.get<string>('NODE_ENV') === 'development',
      logging: configService.get<string>('NODE_ENV') === 'development' ? 'all' : ['error'],
      migrationsTableName: 'migrations',
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      // autoLoadEntities: true, // Can be used if entities are not explicitly listed and path is not given
    };
  },
};

// For TypeORM CLI (used in package.json scripts for migrations)
// This needs to be a DataSource instance
export const AppDataSource = new DataSource({
    ...typeOrmConfig,
    migrationsRun: false, // Ensure migrations are not run automatically by CLI
    // entities and migrations paths might need adjustment if this file is moved
} as DataSourceOptions);
