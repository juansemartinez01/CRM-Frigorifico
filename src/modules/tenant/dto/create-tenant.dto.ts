import { IsString, Matches, Length } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @Matches(/^[a-z0-9-_.]+$/) // slug seguro
  @Length(2, 64)
  id!: string;

  @IsString()
  @Length(2, 120)
  name!: string;
}
