import {
  Injectable,
  Scope,
  Inject,
  
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';  
import { DataSource, Repository } from 'typeorm';
import { CuentaCorriente } from './cuenta-corriente.entity';
import { Request } from 'express';
import { getTenantIdFromReq } from '@app/common/multi-tenant/tenant.util';
import { paginate, Paginated } from '@app/common/pagination/pagination.util';
import { BuscarCuentaCorrienteDto } from './dto/buscar-cuenta-corriente.dto';

@Injectable({ scope: Scope.REQUEST })
export class CuentaCorrienteService {
  constructor(
    @InjectRepository(CuentaCorriente)
    private repo: Repository<CuentaCorriente>,
    private readonly ds: DataSource,
    @Inject(REQUEST) private readonly req: Request,
  ) {}

  private tenantId() {
    return getTenantIdFromReq(this.req);
  }

  async getByCliente(clienteId: string) {
    const row = await this.repo.findOne({
      where: { tenantId: this.tenantId(), clienteId },
    });
    if (!row)
      throw new NotFoundException(
        'Cuenta corriente inexistente para el cliente',
      );
    return row;
  }

  async ensureForCliente(clienteId: string) {
    let row = await this.repo.findOne({
      where: { tenantId: this.tenantId(), clienteId },
    });
    if (!row) {
      row = this.repo.create({
        tenantId: this.tenantId(),
        clienteId,
        saldo: '0',
      });
      row = await this.repo.save(row);
    }
    return row;
  }

  async applyMovimiento(
    clienteId: string,
    tipo: 'VENTA' | 'COBRO',
    monto: string,
  ) {
    // saldo = saldo + monto (VENTA)  |  saldo = saldo - monto (COBRO)
    return this.ds.transaction(async (m) => {
      const repo = m.getRepository(CuentaCorriente);
      let row = await repo.findOne({
        where: { tenantId: this.tenantId(), clienteId },
      });
      if (!row) {
        row = repo.create({ tenantId: this.tenantId(), clienteId, saldo: '0' });
        row = await repo.save(row);
      }
      const current = Number(row.saldo);
      const delta = tipo === 'VENTA' ? Number(monto) : -Number(monto);
      row.saldo = (current + delta).toFixed(2);
      return repo.save(row);
    });
  }

  async searchAll(
    f: BuscarCuentaCorrienteDto,
  ): Promise<Paginated<CuentaCorriente>> {
    const qb = this.repo
      .createQueryBuilder('cc')
      .innerJoinAndSelect('cc.cliente', 'c')
      .where('cc.tenantId = :tenantId', { tenantId: this.tenantId() })
      .andWhere('c.activo = true'); // 👈 SOLO CLIENTES ACTIVOS

    // ==== filtros por cliente ====
    if (f.clienteId)
      qb.andWhere('c.id = :clienteId', { clienteId: f.clienteId });

    if (f.cuit) qb.andWhere('c.cuit ILIKE :cuit', { cuit: `%${f.cuit}%` });

    if (f.nombre)
      qb.andWhere('c.nombre ILIKE :nombre', { nombre: `%${f.nombre}%` });

    if (f.apellido)
      qb.andWhere('c.apellido ILIKE :apellido', {
        apellido: `%${f.apellido}%`,
      });

    // ==== filtros por saldo ====
    if (f.saldoMin) qb.andWhere('cc.saldo >= :min', { min: f.saldoMin });

    if (f.saldoMax) qb.andWhere('cc.saldo <= :max', { max: f.saldoMax });

    // ==== ordenamiento ====
    const sortMap = {
      saldo: 'cc.saldo',
      cliente: 'c.nombre',
    } as const;

    qb.orderBy(sortMap[f.sortBy || 'cliente'], f.sortDir || 'ASC');

    return paginate(qb, f.page, f.limit);
  }
}
