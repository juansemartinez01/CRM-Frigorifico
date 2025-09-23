import { IsOptional, IsUUID, IsString, Length, IsIn } from 'class-validator';
import { PageQueryDto } from '@app/common/pagination/page-query.dto';

export class BuscarClienteDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  @Length(1, 30)
  cuit?: string; // búsqueda parcial por CUIT

  @IsOptional()
  @IsUUID()
  razonSocialId?: string;

  @IsOptional()
  @IsUUID()
  revendedorId?: string;

  @IsOptional()
  @IsIn(['cuit', 'createdAt'])
  sortBy?: 'cuit' | 'createdAt' = 'createdAt';
}
