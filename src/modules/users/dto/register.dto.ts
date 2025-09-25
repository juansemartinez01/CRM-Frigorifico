import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  ArrayNotEmpty,
  IsIn,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  tenant!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['admin', 'operator', 'read'], { each: true })
  roles?: string[]; // default ['read']
}
