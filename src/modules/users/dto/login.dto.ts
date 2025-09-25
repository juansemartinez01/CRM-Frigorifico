import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  // Tenant para login real (el token resultante llevará tid = tenant del user encontrado)
  @IsString()
  tenant!: string;
}
