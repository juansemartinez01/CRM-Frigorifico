import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAjusteDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  clienteId?: number;

  @IsOptional() @IsIn(['DEBE','HABER'])
  tipo?: 'DEBE'|'HABER';

  @IsOptional() @IsIn(['CONFIRMADO','ANULADO'])
  estado?: 'CONFIRMADO'|'ANULADO';

  @IsOptional() @IsDateString()
  desde?: string;

  @IsOptional() @IsDateString()
  hasta?: string;

  @IsOptional() @IsIn(['fecha','numero','created_at'])
  orderBy?: 'fecha'|'numero'|'created_at' = 'fecha';

  @IsOptional() @IsIn(['ASC','DESC'])
  order?: 'ASC'|'DESC' = 'DESC';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;
}
