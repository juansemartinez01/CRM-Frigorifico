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
}
