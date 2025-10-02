import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateRevendedorDto {
  @IsString()
  @Length(11, 20)
  cuit!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre?: string;
}
