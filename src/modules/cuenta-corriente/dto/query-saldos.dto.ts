import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySaldosDto {
  @IsOptional() @IsString()
  q?: string; // busca por nombre/cuit/email

  @IsOptional() @IsIn(['todos','conSaldo','sinSaldo'])
  filtro?: 'todos' | 'conSaldo' | 'sinSaldo' = 'todos';

  @IsOptional() @IsIn(['nombre','saldo','id'])
  orderBy?: 'nombre' | 'saldo' | 'id' = 'nombre';

  @IsOptional() @IsIn(['ASC','DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;
}
