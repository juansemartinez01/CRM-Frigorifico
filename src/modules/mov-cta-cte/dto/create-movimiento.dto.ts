import {
  IsUUID,
  IsString,
  IsIn,
  IsDateString,
  IsNumberString,
} from 'class-validator';

export class CreateMovimientoDto {
  @IsUUID()
  clienteId!: string;

  @IsIn(['VENTA', 'COBRO'])
  tipo!: 'VENTA' | 'COBRO';

  @IsDateString()
  fecha!: string;

  @IsNumberString()
  monto!: string; // numeric as string
}
