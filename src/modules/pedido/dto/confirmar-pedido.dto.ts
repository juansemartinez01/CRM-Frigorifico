import { IsUUID, IsNumberString, IsOptional, IsString } from 'class-validator';

export class ConfirmarPedidoDto {
  @IsUUID()
  pedidoId!: string;

  @IsUUID()
  clienteId!: string; // cliente definitivo elegido en UI

  // precio por kilo ingresado por el usuario
  @IsNumberString()
  precioUnitario!: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  nota?: string;
}
