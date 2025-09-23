import { IsUUID, IsOptional, IsString, Length } from 'class-validator';

export class ResolvePedidoDto {
  @IsUUID()
  pedidoId!: string;

  @IsUUID()
  clienteIdNuevo!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  motivo?: string;

  // opcional hasta tener auth
  @IsOptional()
  @IsString()
  @Length(0, 100)
  actor?: string;
}
