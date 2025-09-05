import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrecioDto {
  @Type(() => Number) @IsInt() @Min(1)
  productoId!: number;

  @IsString()
  precio!: string; // numeric como string

  @IsDateString()
  vigenciaDesde!: string; // YYYY-MM-DD

  @IsOptional() @IsDateString()
  vigenciaHasta?: string | null;

  @IsOptional() @IsBoolean()
  activo?: boolean = true;
}
