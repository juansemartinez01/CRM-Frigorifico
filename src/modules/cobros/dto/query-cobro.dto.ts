import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryCobroDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  clienteId?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  medioId?: number;

  @IsOptional() @IsString()
  numeroLike?: string;

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
