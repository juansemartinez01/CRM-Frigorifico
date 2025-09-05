import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdatePrecioDto {
  @IsOptional() @IsString()
  precio?: string;

  @IsOptional() @IsDateString()
  vigenciaDesde?: string;

  @IsOptional() @IsDateString()
  vigenciaHasta?: string | null;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}
