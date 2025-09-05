import { IsIn, IsInt, IsOptional, IsString, IsDateString, Min, Max, Length } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class LibroQueryDto {
  @IsOptional() @IsIn(['venta', 'cobro', 'todos'])
  tipo?: 'venta' | 'cobro' | 'todos' = 'todos';

  @IsOptional() @IsDateString()
  fechaDesde?: string;

  @IsOptional() @IsDateString()
  fechaHasta?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  clienteId?: number;

  @IsOptional() @IsString() @Length(1, 120)
  cliente?: string;                 // búsqueda por nombre (ILIKE)

  @IsOptional() @IsString() @Length(1, 50)
  remito?: string;                  // búsqueda parcial en número (ILIKE)

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  productoId?: number;

  @IsOptional() @IsString() @Length(1, 120)
  producto?: string;                // búsqueda por nombre de producto (ILIKE)

  @IsOptional() @IsString() @Length(1, 255)
  observaciones?: string;

  @IsOptional() @IsIn(['ASC','DESC'])
  sortFecha?: 'ASC' | 'DESC' = 'ASC';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(2000)
  limit?: number = 50;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;
}
