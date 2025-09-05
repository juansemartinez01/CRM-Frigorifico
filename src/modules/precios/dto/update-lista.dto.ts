import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateListaDto {
  @IsOptional() @IsString() @Length(2, 120)
  nombre?: string;

  @IsOptional() @IsIn(['GENERAL', 'CLIENTE'])
  tipo?: 'GENERAL' | 'CLIENTE';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  clienteId?: number | null;

  @IsOptional() @IsString() @Length(1, 10)
  moneda?: string;

  @IsOptional() @IsString()
  notas?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}
