import { IsString, Length, IsUUID, IsOptional } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @Length(11, 20)
  cuit!: string;

  @IsUUID()
  razonSocialId!: string;

  @IsOptional()
  @IsUUID()
  revendedorId?: string;
}
