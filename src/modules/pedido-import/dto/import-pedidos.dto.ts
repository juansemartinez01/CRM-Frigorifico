import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ImportPedidosDto {
  @IsDateString()
  fechaDesde!: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  sheetName?: string; // por defecto toma la 1° hoja o "Detalle Remitos"
}
