import {
  IsUUID,
  IsOptional,
  IsIn,
  IsDateString,
  IsNumberString,
  MaxLength,
  IsString,
  IsBoolean,
} from 'class-validator';
import { TipoMovimiento } from '../movimiento-cta-cte.entity';

export class UpdateMovimientoDto {
  @IsOptional()
  @IsUUID()
  clienteId?: string; // permitir cambiar de cliente

  @IsOptional()
  @IsIn(['VENTA', 'COBRO'])
  tipo?: TipoMovimiento; // cambiar tipo (afecta el signo)

  @IsOptional()
  @IsDateString()
  fecha?: string; // YYYY-MM-DD

  @IsOptional()
  @IsNumberString()
  monto?: string; // "1234.56"

  // permitir cambiar / limpiar vínculo con pedido
  @IsOptional()
  @IsUUID()
  pedidoId?: string | null; // enviar null explícito para desvincular

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  nota?: string; // enviar "" para limpiar, o texto para actualizar

  @IsOptional()
    @IsBoolean()
    pagado?: boolean;
}
