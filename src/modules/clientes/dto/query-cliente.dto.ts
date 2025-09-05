import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryClienteDto {
  @IsOptional()
  @IsString()
  q?: string; // búsqueda por nombre/email/cuit/teléfono

  @IsOptional()
  @IsIn(['true', 'false'])
  activo?: 'true' | 'false';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsIn(['id', 'nombre', 'created_at'])
  orderBy?: 'id' | 'nombre' | 'created_at' = 'id';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}
