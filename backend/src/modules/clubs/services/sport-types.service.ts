import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { SportType } from '../entities/sport-type.entity';
import { CreateSportTypeDto } from '../dto/create-sport-type.dto';
import { UpdateSportTypeDto } from '../dto/update-sport-type.dto';

@Injectable()
export class SportTypesService {
  constructor(
    @InjectRepository(SportType)
    private readonly sportTypeRepository: Repository<SportType>,
  ) {}

  async create(createDto: CreateSportTypeDto): Promise<SportType> {
    const existingSportType = await this.sportTypeRepository.findOneBy({ name: createDto.name });
    if (existingSportType) {
      throw new BadRequestException(`نوع ورزشی با نام '${createDto.name}' از قبل موجود است.`);
    }
    const sportType = this.sportTypeRepository.create(createDto);
    try {
      return await this.sportTypeRepository.save(sportType);
    } catch (error) {
      throw new InternalServerErrorException('خطا در ایجاد نوع ورزش جدید.');
    }
  }

  async findAll(options?: FindManyOptions<SportType>): Promise<SportType[]> {
    return this.sportTypeRepository.find(options);
  }

  async findOne(id: number, options?: FindOneOptions<SportType>): Promise<SportType | null> {
    return this.sportTypeRepository.findOne({ where: { id }, ...options });
  }

  async findOneOrFail(id: number, options?: FindOneOptions<SportType>): Promise<SportType> {
    const sportType = await this.findOne(id, options);
    if (!sportType) {
      throw new NotFoundException(`نوع ورزشی با شناسه '${id}' یافت نشد.`);
    }
    return sportType;
  }

  async findByIds(ids: number[]): Promise<SportType[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.sportTypeRepository.createQueryBuilder('sport_type')
      .where('sport_type.id IN (:...ids)', { ids })
      .getMany();
  }

  async update(id: number, updateDto: UpdateSportTypeDto): Promise<SportType> {
    const sportType = await this.findOneOrFail(id);

    if (updateDto.name && updateDto.name !== sportType.name) {
      const existingSportType = await this.sportTypeRepository.findOneBy({ name: updateDto.name });
      if (existingSportType && existingSportType.id !== id) {
        throw new BadRequestException(`نوع ورزشی با نام '${updateDto.name}' از قبل موجود است.`);
      }
    }

    Object.assign(sportType, updateDto);
    try {
      return await this.sportTypeRepository.save(sportType);
    } catch (error) {
      throw new InternalServerErrorException('خطا در به‌روزرسانی نوع ورزش.');
    }
  }

  async remove(id: number): Promise<void> {
    const sportType = await this.findOneOrFail(id); // Ensure it exists
    // Consider checking if this sport type is used by any club or schedule before deleting
    const result = await this.sportTypeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`نوع ورزشی با شناسه '${id}' یافت نشد (ممکن است همزمان حذف شده باشد).`);
    }
  }
}
