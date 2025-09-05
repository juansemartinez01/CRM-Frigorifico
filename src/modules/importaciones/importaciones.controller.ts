import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportacionesService } from './importaciones.service';
// import { File as MulterFile } from 'multer';

@Controller('importaciones')
export class ImportacionesController {
  constructor(private readonly service: ImportacionesService) {}

  @Post('remitos-excel')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  }))
  async importRemitosExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Subí un archivo en el campo "file" (multipart/form-data) con nombre "file"');
    return this.service.importDetalleRemitos(file.buffer);
  }
}
