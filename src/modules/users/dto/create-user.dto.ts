import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  ArrayNotEmpty,
  IsIn,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['admin', 'operator', 'read'], { each: true })
  roles?: string[]; // default: ['read']
}
