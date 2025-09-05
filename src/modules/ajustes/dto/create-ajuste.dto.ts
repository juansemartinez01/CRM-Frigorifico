import { IsDateString, IsIn, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateAjusteDto {
  @IsDateString()
  fecha!: string;

  @Type(() => Number) @IsInt() @Min(1)
  clienteId!: number;

  @IsIn(['DEBE', 'HABER'])
  tipo!: 'DEBE' | 'HABER';

  @IsIn(['BONIFICACION','REDONDEO','INTERES','CORRECCION','OTRO'])
  motivo!: 'BONIFICACION' | 'REDONDEO' | 'INTERES' | 'CORRECCION' | 'OTRO';

  // acepta "1234.56" o 1234.56 → string
  @Transform(({ value }) => String(value))
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'monto debe tener hasta 2 decimales' })
  monto!: string;

  @IsOptional() @IsString()
  observaciones?: string;
}
