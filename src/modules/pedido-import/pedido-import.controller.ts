import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportPedidosDto } from './dto/import-pedidos.dto';
import { PedidoImportService } from './pedido-import.service';

@Controller('pedidos')
export class PedidoImportController {
  constructor(private readonly service: PedidoImportService) {}

  @Post('importar-excel')
  @UseInterceptors(FileInterceptor('file'))
  importar(
    @UploadedFile() file: Express.Multer.File,
    @Query() query: ImportPedidosDto,
  ) {
    return this.service.importarExcel(file, query);
  }
}
