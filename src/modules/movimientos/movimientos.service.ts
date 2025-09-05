import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovimientoCC, OrigenMovimiento, TipoMovimiento } from './movimiento.entity';
import { RequestContext } from '../../common/request-context';

@Injectable()
export class MovimientosService {
  constructor(@InjectRepository(MovimientoCC) private repo: Repository<MovimientoCC>) {}

  async crear(
    params: {
      clienteId: number;
      fecha: string;
      tipo: TipoMovimiento;
      origen: OrigenMovimiento;
      referenciaId?: number;
      monto: string;
      observaciones?: string;
    },
  ) {
    const tenantId = RequestContext.tenantId()!;
    const mov = this.repo.create({ ...params, tenant_id: tenantId });
    return this.repo.save(mov);
  }

  async revertirDe(origen: OrigenMovimiento, referenciaId: number, observaciones?: string) {
    const tenantId = RequestContext.tenantId()!;
    const mov = await this.repo.findOne({ where: { tenant_id: tenantId, origen, referenciaId } });
    if (!mov) return null;
    // Contra-asiento
    const tipo: TipoMovimiento = mov.tipo === 'DEBE' ? 'HABER' : 'DEBE';
    const rev = this.repo.create({
      tenant_id: tenantId,
      clienteId: mov.clienteId,
      fecha: mov.fecha,
      tipo,
      origen,
      referenciaId,
      monto: mov.monto,
      observaciones: observaciones ?? 'Reverso automático',
    });
    return this.repo.save(rev);
  }
}
