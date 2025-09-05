import { IsArray, IsDateString, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RemitoItemDto } from './remito-item.dto';

export class CreateRemitoDto {
  @IsDateString()
  fecha!: string; // YYYY-MM-DD

  @IsOptional()
  @IsInt() @Min(1)
  numero?: number; // si no viene, se autogenera

  @Type(() => Number) @IsInt() @Min(1)
  clienteId!: number;

  @IsOptional()
  @Type(() => Number) @IsInt() @Min(1)
  usuarioId?: number;

  @IsOptional() @IsString()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RemitoItemDto)
  items!: RemitoItemDto[];
}
