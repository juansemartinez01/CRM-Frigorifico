import { IsBoolean, IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';



function onlyDigits(v?: any) {
  if (v === null || v === undefined) return undefined;
  const s = String(v).replace(/\D+/g, '');
  return s.length ? s : undefined;
}


export class UpdateClienteDto {
  @IsOptional()
  @IsString()
  @Length(2, 150)
  nombre?: string;

  @IsOptional()
    @Transform(({ value }) => onlyDigits(value)) // 👈 normaliza
    @IsOptional()
    @IsString()
    cuit?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(6, 30)
  telefono?: string;

  @IsOptional()
  @IsString()
  @Length(2, 255)
  direccion?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
