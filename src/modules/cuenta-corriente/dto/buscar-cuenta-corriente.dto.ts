// dto/buscar-cuenta-corriente.dto.ts
import {
  IsOptional,
  IsUUID,
  IsString,
  IsNumberString,
  IsIn,
} from 'class-validator';
import { PageQueryDto } from '@app/common/pagination/page-query.dto';

export class BuscarCuentaCorrienteDto extends PageQueryDto {
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsString()
  cuit?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsNumberString()
  saldoMin?: string;

  @IsOptional()
  @IsNumberString()
  saldoMax?: string;

  @IsOptional()
  @IsIn(['saldo', 'cliente'])
  sortBy?: 'saldo' | 'cliente' = 'cliente';

  @IsIn(['ASC', 'DESC'])
  sortDir: 'ASC' | 'DESC' = 'ASC';
}
