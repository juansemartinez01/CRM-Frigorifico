import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUnidadDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  simbolo?: string;
}
