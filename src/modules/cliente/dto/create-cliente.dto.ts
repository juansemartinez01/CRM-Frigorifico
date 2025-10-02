import { IsString, Length, IsUUID, IsOptional, MaxLength, Matches, IsEmail } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @Length(11, 20)
  cuit!: string;

  @IsUUID()
  razonSocialId!: string;

  @IsOptional()
  @IsUUID()
  revendedorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  apellido?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^[0-9+\-().\s]*$/, { message: 'telefono inválido' })
  telefono?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;
}
