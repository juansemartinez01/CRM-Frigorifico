import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductoDto {
  @IsOptional() @IsString()
  q?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  unidadId?: number;

  @IsOptional() @IsIn(['id', 'sku', 'nombre', 'created_at'])
  orderBy?: 'id' | 'sku' | 'nombre' | 'created_at' = 'nombre';

  @IsOptional() @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;
}
