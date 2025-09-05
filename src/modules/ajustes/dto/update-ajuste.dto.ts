import { IsDateString, IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateAjusteDto {
  @IsOptional() @IsDateString()
  fecha?: string;

  @IsOptional() @IsIn(['DEBE', 'HABER'])
  tipo?: 'DEBE' | 'HABER';

  @IsOptional() @IsIn(['BONIFICACION','REDONDEO','INTERES','CORRECCION','OTRO'])
  motivo?: 'BONIFICACION' | 'REDONDEO' | 'INTERES' | 'CORRECCION' | 'OTRO';

  @IsOptional()
  @Transform(({ value }) => value === undefined ? value : String(value))
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'monto debe tener hasta 2 decimales' })
  monto?: string;

  @IsOptional() @IsString()
  observaciones?: string;
}
