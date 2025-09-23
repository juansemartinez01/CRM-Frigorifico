import { IsString, Length } from 'class-validator';

export class CreateRazonSocialDto {
  @IsString()
  @Length(11, 20)
  cuit!: string;
}
