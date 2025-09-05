import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPrecioDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  productoId?: number;

  // Devuelve solo precios vigentes en esa fecha (incluye abiertos)
  @IsOptional() @IsDateString()
  vigenciaEn?: string;

  @IsOptional() @IsIn(['id','vigenciaDesde','productoId'])
  orderBy?: 'id' | 'vigenciaDesde' | 'productoId' = 'vigenciaDesde';

  @IsOptional() @IsIn(['ASC','DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;
}
