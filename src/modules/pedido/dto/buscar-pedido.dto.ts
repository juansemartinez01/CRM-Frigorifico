import {
  IsOptional,
  IsUUID,
  IsString,
  Length,
  IsDateString,
  IsIn,
} from 'class-validator';
import { PageQueryDto } from '@app/common/pagination/page-query.dto';

export class BuscarPedidoDto extends PageQueryDto {
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  numeroRemito?: string; // búsqueda parcial

  @IsOptional()
  @IsString()
  @Length(1, 200)
  articulo?: string; // búsqueda parcial

  @IsOptional()
  @IsDateString()
  fechaDesde?: string; // YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  fechaHasta?: string; // YYYY-MM-DD

  @IsOptional()
  @IsIn(['fechaRemito', 'numeroRemito', 'createdAt'])
  sortBy?: 'fechaRemito' | 'numeroRemito' | 'createdAt' = 'fechaRemito';
}
