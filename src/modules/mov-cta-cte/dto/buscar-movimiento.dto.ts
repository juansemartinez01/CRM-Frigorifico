import {
  IsOptional,
  IsUUID,
  IsIn,
  IsDateString,
  IsNumberString,
} from 'class-validator';
import { PageQueryDto } from '@app/common/pagination/page-query.dto';

export class BuscarMovimientoDto extends PageQueryDto {
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsIn(['VENTA', 'COBRO'])
  tipo?: 'VENTA' | 'COBRO';

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsNumberString()
  montoMin?: string;

  @IsOptional()
  @IsNumberString()
  montoMax?: string;

  // Sólo permitimos ordenar por fecha o createdAt
  @IsOptional()
  @IsIn(['fecha', 'createdAt'])
  sortBy?: 'fecha' | 'createdAt' = 'fecha';
}
