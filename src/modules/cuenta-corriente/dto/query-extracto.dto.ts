import { IsDateString, IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryExtractoDto {
  @IsOptional() @IsDateString()
  desde?: string;

  @IsOptional() @IsDateString()
  hasta?: string;

  @IsOptional() @IsIn(['ASC','DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 100;
}
