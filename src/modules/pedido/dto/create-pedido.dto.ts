import {
  IsUUID,
  IsDateString,
  IsString,
  Length,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class CreatePedidoDto {
  @IsUUID()
  clienteId!: string;

  @IsDateString()
  fechaRemito!: string; // YYYY-MM-DD

  @IsString()
  @Length(1, 50)
  numeroRemito!: string;

  @IsString()
  @Length(1, 200)
  articulo!: string;

  @IsNumberString()
  cantidad!: string; // numeric as string

  @IsNumberString()
  kg!: string; // numeric as string

  @IsOptional()
  @IsString()
  observaciones?: string;
}
