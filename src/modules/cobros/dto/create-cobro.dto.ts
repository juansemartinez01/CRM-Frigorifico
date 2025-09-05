import { IsArray, IsDateString, IsInt, IsOptional, IsString, Length, Min, ValidateNested, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AplicacionDto } from './aplicacion.dto';

export class CreateCobroDto {
  @IsDateString()
  fecha!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  numero?: number;

  @Type(() => Number) @IsInt() @Min(1)
  clienteId!: number;

  @Type(() => Number) @IsInt() @Min(1)
  medioId!: number;

  @IsOptional() @IsString() @Length(1, 60)
  comprobante?: string;

  @Transform(({ value }) => value === undefined || value === null ? value : String(value))
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'monto debe tener hasta 2 decimales' })
  monto!: string;

  @IsOptional() @IsString()
  observaciones?: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => AplicacionDto)
  aplicaciones!: AplicacionDto[]; // puede venir vacío: crédito del cliente
}
