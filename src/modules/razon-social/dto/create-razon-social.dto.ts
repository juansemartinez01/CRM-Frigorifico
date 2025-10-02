import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateRazonSocialDto {
  @IsString()
  @Length(11, 20)
  cuit!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre?: string;
}
