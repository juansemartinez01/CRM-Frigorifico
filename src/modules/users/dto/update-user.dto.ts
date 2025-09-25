import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import {
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  ArrayNotEmpty,
  IsIn,
} from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['admin', 'operator', 'read'], { each: true })
  roles?: string[];
}
