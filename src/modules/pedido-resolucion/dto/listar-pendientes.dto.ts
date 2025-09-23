import { IsOptional, IsString, Length } from 'class-validator';
import { PageQueryDto } from '@app/common/pagination/page-query.dto';

export class ListarPendientesDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  numeroRemito?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  articulo?: string;
}
