import { PartialType } from '@nestjs/mapped-types';
import { CreateRevendedorDto } from './create-revendedor.dto';

export class UpdateRevendedorDto extends PartialType(CreateRevendedorDto) {}
