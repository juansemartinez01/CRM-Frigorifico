import {
  IsUUID,
  IsString,
  IsIn,
  IsDateString,
  IsNumberString,
  IsOptional,
  MaxLength,
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

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  nota?: string; // texto libre opcional
}
