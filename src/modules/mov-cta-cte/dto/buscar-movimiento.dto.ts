import {
  IsOptional,
  IsUUID,
  IsIn,
  IsDateString,
  IsNumberString,
  IsBoolean,
} from 'class-validator';
import { PageQueryDto } from '@app/common/pagination/page-query.dto';
import { Transform } from 'class-transformer';

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

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  pagado?: boolean;

  // Sólo permitimos ordenar por fecha o createdAt
  @IsOptional()
  @IsIn(['fecha', 'createdAt'])
  sortBy?: 'fecha' | 'createdAt' = 'fecha';
}
