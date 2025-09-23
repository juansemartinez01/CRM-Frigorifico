import { IsString, Length } from 'class-validator';

export class CreateRevendedorDto {
  @IsString()
  @Length(11, 20)
  cuit!: string;
}
