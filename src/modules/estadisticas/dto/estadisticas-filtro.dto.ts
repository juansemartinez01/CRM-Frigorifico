import { IsDateString, IsOptional } from 'class-validator';

export class EstadisticasFiltroDto {
  @IsOptional()
  @IsDateString()
  fechaDesde?: string; // YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  fechaHasta?: string; // YYYY-MM-DD
}
