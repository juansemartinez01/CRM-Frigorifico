// src/modules/productos/dto/create-producto.dto.ts
import { IsBoolean, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const trimOrUndef = (v: any) => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

export class CreateProductoDto {
  @IsString() @Length(1, 120)
  @Transform(({ value }) => String(value).trim())
  nombre!: string;

  // ahora opcional
  @IsOptional()
  @IsString() @Length(1, 60)
  @Transform(({ value }) => trimOrUndef(value))
  sku?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @Type(() => Number)
  @IsInt()
  unidadId!: number;

  @IsOptional()
  @Transform(({ value }) => value !== undefined ? String(Number(value).toFixed(2)) : undefined)
  precioBase?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
