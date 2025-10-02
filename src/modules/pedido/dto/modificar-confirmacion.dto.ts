import {
  IsUUID,
  IsOptional,
  IsNumberString,
  IsBooleanString,
  IsString,
} from 'class-validator';

export class ModificarConfirmacionDto {
  @IsUUID()
  pedidoId!: string;

  // cualquiera de los dos puede venir (al menos uno debe venir)
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsNumberString()
  precioUnitario?: string; // precio por kilo

  // opcional: concatenar a observaciones del pedido
  @IsOptional()
  @IsString()
  observaciones?: string;

  // si querés borrar el movimiento y generarlo de nuevo (en vez de actualizar en lugar)
  @IsOptional()
  @IsBooleanString()
  recrearMovimiento?: string; // "true" | "false"
}
