import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryListaDto {
  @IsOptional() @IsString()
  q?: string;

  @IsOptional() @IsIn(['GENERAL','CLIENTE'])
  tipo?: 'GENERAL' | 'CLIENTE';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  clienteId?: number;

  @IsOptional() @IsIn(['true','false'])
  activo?: 'true' | 'false';

  @IsOptional() @IsIn(['id','nombre','created_at'])
  orderBy?: 'id' | 'nombre' | 'created_at' = 'nombre';

  @IsOptional() @IsIn(['ASC','DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;
}
