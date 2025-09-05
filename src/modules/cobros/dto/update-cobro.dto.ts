import { IsArray, IsDateString, IsInt, IsOptional, IsString, Length, Min, ValidateNested, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AplicacionDto } from './aplicacion.dto';

export class UpdateCobroDto {
  @IsOptional() @IsDateString()
  fecha?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  medioId?: number;

  @IsOptional() @IsString() @Length(1, 60)
  comprobante?: string;

  @IsOptional()
  @Transform(({ value }) => value === undefined || value === null ? value : String(value))
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'monto debe tener hasta 2 decimales' })
  monto?: string;

  @IsOptional() @IsString()
  observaciones?: string;

  // Política: si viene, reemplaza TODAS las aplicaciones
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AplicacionDto)
  aplicaciones?: AplicacionDto[];
}
