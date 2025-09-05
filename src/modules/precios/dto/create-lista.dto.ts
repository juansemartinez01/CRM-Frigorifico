import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateListaDto {
  @IsString() @Length(2, 120)
  nombre!: string;

  @IsIn(['GENERAL', 'CLIENTE'])
  tipo!: 'GENERAL' | 'CLIENTE';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  clienteId?: number;

  @IsOptional() @IsString() @Length(1, 10)
  moneda?: string = 'ARS';

  @IsOptional() @IsString()
  notas?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean = true;
}
