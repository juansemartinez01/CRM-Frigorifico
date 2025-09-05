import { IsArray, IsDateString, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RemitoItemDto } from './remito-item.dto';

export class UpdateRemitoDto {
  @IsOptional() @IsDateString()
  fecha?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  clienteId?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  usuarioId?: number;

  @IsOptional() @IsString()
  observaciones?: string;

  // Política: si viene items, reemplaza el detalle completo
  @IsOptional() @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RemitoItemDto)
  items?: RemitoItemDto[];
}
