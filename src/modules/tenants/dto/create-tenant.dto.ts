import { IsOptional, IsString, Length } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @Length(2, 150)
  nombre!: string;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  cuit?: string;
}
