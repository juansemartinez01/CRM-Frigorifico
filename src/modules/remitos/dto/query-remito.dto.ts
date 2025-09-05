import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRemitoDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  clienteId?: number;

  @IsOptional() @IsString()
  numeroLike?: string;

  @IsOptional() @IsIn(['CONFIRMADO','ANULADO'])
  estado?: 'CONFIRMADO' | 'ANULADO';

  @IsOptional() @IsDateString()
  desde?: string;

  @IsOptional() @IsDateString()
  hasta?: string;

  @IsOptional() @IsIn(['id','numero','fecha','created_at'])
  orderBy?: 'id' | 'numero' | 'fecha' | 'created_at' = 'fecha';

  @IsOptional() @IsIn(['ASC','DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;
}
