import { IsArray, IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(2, 120)
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 100)
  password!: string;

  @IsOptional()
  @IsArray()
  roles?: string[]; // nombres de rol (ej: ["admin"])
}
