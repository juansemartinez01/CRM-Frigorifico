import { Injectable, Scope, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';  
import { DataSource, Repository } from 'typeorm';
import { MovimientoCuentaCorriente } from './movimiento-cta-cte.entity';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { Request } from 'express';
import { getTenantIdFromReq } from '@app/common/multi-tenant/tenant.util';
import { CuentaCorrienteService } from '@app/modules/cuenta-corriente/cuenta-corriente.service';
import { BuscarMovimientoDto } from './dto/buscar-movimiento.dto';
import { paginate, Paginated } from '@app/common/pagination/pagination.util';

@Injectable({ scope: Scope.REQUEST })
export class MovimientoCtaCteService {
  constructor(
    @InjectRepository(MovimientoCuentaCorriente)
    private repo: Repository<MovimientoCuentaCorriente>,
    private readonly ds: DataSource,
    private readonly ctaService: CuentaCorrienteService,
    @Inject(REQUEST) private readonly req: Request,
  ) {}

  private tenantId() {
    return getTenantIdFromReq(this.req);
  }

  async create(dto: CreateMovimientoDto) {
    return this.ds.transaction(async (m) => {
      // 1) crear movimiento
      const movRepo = m.getRepository(MovimientoCuentaCorriente);
      const mov = movRepo.create({ ...dto, tenantId: this.tenantId() });
      const saved = await movRepo.save(mov);
      // 2) aplicar al saldo
      await this.ctaService.applyMovimiento(dto.clienteId, dto.tipo, dto.monto);
      return saved;
    });
  }

  async listByCliente(clienteId: string) {
    return this.repo.find({
      where: { tenantId: this.tenantId(), clienteId },
      order: { fecha: 'DESC', createdAt: 'DESC' },
    });
  }
  async search(
    f: BuscarMovimientoDto,
  ): Promise<Paginated<MovimientoCuentaCorriente>> {
    const qb = this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.cliente', 'c')
      .where('m.tenantId = :tenantId', { tenantId: this.tenantId() });

    if (f.clienteId)
      qb.andWhere('m.clienteId = :clienteId', { clienteId: f.clienteId });
    if (f.tipo) qb.andWhere('m.tipo = :tipo', { tipo: f.tipo });
    if (f.fechaDesde) qb.andWhere('m.fecha >= :fd', { fd: f.fechaDesde });
    if (f.fechaHasta) qb.andWhere('m.fecha <= :fh', { fh: f.fechaHasta });

    // Comparaciones por rango de monto
    if (f.montoMin) qb.andWhere('m.monto >= :min', { min: f.montoMin });
    if (f.montoMax) qb.andWhere('m.monto <= :max', { max: f.montoMax });

    const sortMap = { fecha: 'm.fecha', createdAt: 'm.createdAt' } as const;
    qb.orderBy(sortMap[f.sortBy || 'fecha'], f.sortDir || 'DESC');

    return paginate(qb, f.page, f.limit);
  }
}
