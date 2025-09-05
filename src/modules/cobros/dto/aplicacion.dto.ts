import { IsInt, Min, IsString, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AplicacionDto {
  @Type(() => Number) @IsInt() @Min(1)
  remitoId!: number;

  // acepta "1234.56" o 1234.56 y lo normaliza a string
  @Transform(({ value }) => value === undefined || value === null ? value : String(value))
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'monto debe tener hasta 2 decimales' })
  monto!: string;
}
