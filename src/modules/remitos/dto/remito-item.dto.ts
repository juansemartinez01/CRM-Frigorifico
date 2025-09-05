import { IsInt, IsOptional, IsString, Length, Min, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class RemitoItemDto {
  @Type(() => Number) @IsInt() @Min(1)
  productoId!: number;

  @IsString() @Length(1, 120)
  descripcion!: string;

  // acepta "41.680" o 41.68; lo convertimos a string y validamos hasta 3 decimales
  @Transform(({ value }) => value === undefined || value === null ? value : String(value))
  @IsString()
  @Matches(/^\d+(\.\d{1,3})?$/, { message: 'cantidad debe tener hasta 3 decimales' })
  cantidad!: string;

  // acepta "7600.00" o 7600; lo convertimos a string y validamos hasta 2 decimales
  @Transform(({ value }) => value === undefined || value === null ? value : String(value))
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'precio debe tener hasta 2 decimales' })
  precio!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  id?: number;
}
