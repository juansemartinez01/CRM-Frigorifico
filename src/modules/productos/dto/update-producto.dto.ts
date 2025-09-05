// src/modules/productos/dto/update-producto.dto.ts
import { IsBoolean, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const trimOrUndef = (v: any) => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

export class UpdateProductoDto {
  @IsOptional()
  @IsString() @Length(1, 120)
  @Transform(({ value }) => trimOrUndef(value))
  nombre?: string;

  // también opcional en update
  @IsOptional()
  @IsString() @Length(1, 60)
  @Transform(({ value }) => trimOrUndef(value))
  sku?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional() @Type(() => Number) @IsInt()
  unidadId?: number;

  @IsOptional()
  @Transform(({ value }) => value !== undefined ? String(Number(value).toFixed(2)) : undefined)
  precioBase?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}
