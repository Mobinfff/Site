import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { ClubFacility } from '../entities/club-facility.entity';
import { CreateClubFacilityDto } from '../dto/create-club-facility.dto';
import { UpdateClubFacilityDto } from '../dto/update-club-facility.dto';

@Injectable()
export class ClubFacilitiesService {
  constructor(
    @InjectRepository(ClubFacility)
    private readonly facilityRepository: Repository<ClubFacility>,
  ) {}

  async create(createDto: CreateClubFacilityDto): Promise<ClubFacility> {
    const existingFacility = await this.facilityRepository.findOneBy({ name: createDto.name });
    if (existingFacility) {
      throw new BadRequestException(`امکاناتی با نام '${createDto.name}' از قبل موجود است.`);
    }
    const facility = this.facilityRepository.create(createDto);
    try {
      return await this.facilityRepository.save(facility);
    } catch (error) {
      throw new InternalServerErrorException('خطا در ایجاد امکانات جدید.');
    }
  }

  async findAll(options?: FindManyOptions<ClubFacility>): Promise<ClubFacility[]> {
    return this.facilityRepository.find(options);
  }

  async findOne(id: number, options?: FindOneOptions<ClubFacility>): Promise<ClubFacility | null> {
    return this.facilityRepository.findOne({ where: { id }, ...options });
  }

  async findOneOrFail(id: number, options?: FindOneOptions<ClubFacility>): Promise<ClubFacility> {
    const facility = await this.findOne(id, options);
    if (!facility) {
      throw new NotFoundException(`امکاناتی با شناسه '${id}' یافت نشد.`);
    }
    return facility;
  }

  async findByIds(ids: number[]): Promise<ClubFacility[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.facilityRepository.createQueryBuilder('facility')
      .where('facility.id IN (:...ids)', { ids })
      .getMany();
  }

  async update(id: number, updateDto: UpdateClubFacilityDto): Promise<ClubFacility> {
    const facility = await this.findOneOrFail(id);

    if (updateDto.name && updateDto.name !== facility.name) {
      const existingFacility = await this.facilityRepository.findOneBy({ name: updateDto.name });
      if (existingFacility && existingFacility.id !== id) {
        throw new BadRequestException(`امکاناتی با نام '${updateDto.name}' از قبل موجود است.`);
      }
    }

    Object.assign(facility, updateDto);
    try {
      return await this.facilityRepository.save(facility);
    } catch (error) {
      throw new InternalServerErrorException('خطا در به‌روزرسانی امکانات.');
    }
  }

  async remove(id: number): Promise<void> {
    const facility = await this.findOneOrFail(id); // Ensure it exists
    // Consider checking if this facility is used by any club before deleting
    // For now, we proceed with deletion.
    const result = await this.facilityRepository.delete(id);
    if (result.affected === 0) {
      // This case should ideally not be reached if findOneOrFail succeeded
      throw new NotFoundException(`امکاناتی با شناسه '${id}' یافت نشد (ممکن است همزمان حذف شده باشد).`);
    }
  }
}
