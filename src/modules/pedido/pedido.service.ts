import {
  Injectable,
  NotFoundException,
  Scope,
  Inject,
  BadRequestException,
  ConflictException,
  
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DataSource, QueryFailedError, Between } from 'typeorm';
import { REQUEST } from '@nestjs/core';  
import { Request } from 'express';
import { getTenantIdFromReq } from '@app/common/multi-tenant/tenant.util';
import { Pedido } from './pedido.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { BuscarPedidoDto } from './dto/buscar-pedido.dto';
import { paginate, Paginated } from '@app/common/pagination/pagination.util';
import { MovimientoCuentaCorriente } from '../mov-cta-cte/movimiento-cta-cte.entity';
import { ConfirmarPedidoDto } from './dto/confirmar-pedido.dto';
import { ModificarConfirmacionDto } from './dto/modificar-confirmacion.dto';
import { Cliente } from '@app/modules/cliente/cliente.entity';
import { CuentaCorriente } from '../cuenta-corriente/cuenta-corriente.entity';

@Injectable({ scope: Scope.REQUEST })
export class PedidoService {
  constructor(
    @InjectRepository(Pedido) private repo: Repository<Pedido>,
    @Inject(REQUEST) private readonly req: Request,
    @InjectRepository(CuentaCorriente)
    private ccRepo: Repository<CuentaCorriente>,
    private ds: DataSource,
  ) {}

  private whereTenant(extra?: FindOptionsWhere<Pedido>) {
    const tenantId = getTenantIdFromReq(this.req);
    return { tenantId, ...(extra ?? {}) };
  }

  async create(dto: CreatePedidoDto) {
    const entity = this.repo.create({
      ...dto,
      tenantId: getTenantIdFromReq(this.req),
    });
    return this.repo.save(entity);
  }

  async findAll() {
    return this.repo.find({ where: this.whereTenant() });
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({ where: this.whereTenant({ id }) });
    if (!row) throw new NotFoundException('Pedido no encontrado');
    return row;
  }

  async update(id: string, dto: UpdatePedidoDto) {
    const row = await this.findOne(id);
    Object.assign(row, dto);
    return this.repo.save(row);
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    await this.repo.remove(row);
    return { ok: true };
  }

  async search(f: BuscarPedidoDto): Promise<Paginated<Pedido>> {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.cliente', 'c')
      .where('p.tenantId = :tenantId', { tenantId: this.tenantId() });

    if (f.clienteId)
      qb.andWhere('p.clienteId = :clienteId', { clienteId: f.clienteId });
    if (f.numeroRemito)
      qb.andWhere('p.numeroRemito ILIKE :nr', { nr: `%${f.numeroRemito}%` });
    if (f.articulo)
      qb.andWhere('p.articulo ILIKE :art', { art: `%${f.articulo}%` });
    if (f.fechaDesde) qb.andWhere('p.fechaRemito >= :fd', { fd: f.fechaDesde });
    if (f.fechaHasta) qb.andWhere('p.fechaRemito <= :fh', { fh: f.fechaHasta });

    const sortMap = {
      fechaRemito: 'p.fechaRemito',
      numeroRemito: 'p.numeroRemito',
      createdAt: 'p.createdAt',
    } as const;
    qb.orderBy(sortMap[f.sortBy || 'fechaRemito'], f.sortDir || 'DESC');

    return paginate(qb, f.page, f.limit);
  }

  private tenantId() {
    return getTenantIdFromReq(this.req);
  }

  /*
   * Confirma un pedido asignando cliente definitivo y precio por kilo,
   * calcula el total e impacta un movimiento de VENTA ligado al pedido.
   * Idempotente: (tenant, tipo=VENTA, pedidoId) único.
   */
  async confirmarPedido(dto: ConfirmarPedidoDto) {
    const tenantId = this.tenantId();
    const precioUnit = Number(dto.precioUnitario);
    if (!isFinite(precioUnit) || precioUnit <= 0) {
      throw new BadRequestException('precioUnitario inválido');
    }

    return this.ds.transaction(async (m) => {
      const pedido = await m.getRepository(Pedido).findOne({
        where: { tenantId, id: dto.pedidoId },
      });
      if (!pedido) throw new NotFoundException('Pedido no encontrado');

      // ⛔ Pre-chequeo: ¿ya confirmado?
      const existente = await m
        .getRepository(MovimientoCuentaCorriente)
        .findOne({
          where: { tenantId, tipo: 'VENTA', pedidoId: pedido.id },
        });
      if (existente) {
        throw new ConflictException({
          code: 'ALREADY_CONFIRMED',
          message: 'Este pedido ya fue confirmado previamente.',
          movimientoId: existente.id,
          monto: existente.monto,
          fecha: existente.fecha,
        });
      }

      // 👉 cargar y asignar el cliente definitivo (para refrescar la relación eager)
      const cRepo = m.getRepository(Cliente);
      const cliente = await cRepo.findOne({
        where: { tenantId, id: dto.clienteId },
      });
      if (!cliente)
        throw new NotFoundException('Cliente destino no encontrado');

      // actualizar cliente final y precios
      const kg = Number(pedido.kg ?? 0);
      const total = +(kg * precioUnit).toFixed(2);

      pedido.clienteId = dto.clienteId;
      pedido.cliente = cliente;
      pedido.precioUnitario = precioUnit.toFixed(2);
      pedido.precioTotal = total.toFixed(2);

      if (dto.nota) {
        pedido.nota = dto.nota;
      }
      if (dto.observaciones) {
        pedido.observaciones = [pedido.observaciones, dto.observaciones]
          .filter(Boolean)
          .join(' | ');
      }
      pedido.confirmado = true;

      await m.getRepository(Pedido).save(pedido);

      // Crear movimiento ligado al pedido (VENTA)
      const mov = m.getRepository(MovimientoCuentaCorriente).create({
        tenantId,
        clienteId: dto.clienteId,
        tipo: 'VENTA',
        fecha: pedido.fechaRemito ?? new Date(),
        monto: total.toFixed(2),
        pedidoId: pedido.id,
      });

      try {
        await m.getRepository(MovimientoCuentaCorriente).save(mov);
      } catch (err) {
        if (
          err instanceof QueryFailedError &&
          // @ts-ignore
          err.driverError?.code === '23505'
        ) {
          throw new ConflictException({
            code: 'ALREADY_CONFIRMED',
            message: 'Este pedido ya fue confirmado previamente.',
          });
        }
        throw err;
      }

      // ⬇️⬇️ Actualización de saldo ATÓMICA para evitar race conditions
      const inc = total.toFixed(2);
      await m.query(
        `
      INSERT INTO cuenta_corriente (tenant_id, cliente_id, saldo, created_at, updated_at)
      VALUES ($1, $2, $3, now(), now())
      ON CONFLICT (tenant_id, cliente_id)
      DO UPDATE SET saldo = (cuenta_corriente.saldo::numeric) + EXCLUDED.saldo,
                    updated_at = now();
      `,
        [tenantId, dto.clienteId, inc],
      );

      return {
        ok: true,
        pedido,
        movimiento: mov,
      };
    });
  }

  async deleteNoConfirmados() {
    const tenantId = this.tenantId();

    // Elimina en bloque: (tenantId = req.user.tid) AND (confirmado = false)
    const res = await this.repo.delete({ tenantId, confirmado: false });

    return {
      ok: true,
      deleted: res.affected ?? 0,
    };
  }

  /**
   * Modifica una confirmación existente:
   * - Puede cambiar cliente y/o precio por kilo (recalcula total)
   * - Actualiza el movimiento VENTA asociado (o lo recrea)
   * - Ajusta la(s) cuenta(s) corriente(s): mueve el saldo entre clientes o aplica la diferencia
   */
  async modificarConfirmacion(dto: ModificarConfirmacionDto) {
    const tenantId = this.tenantId();

    if (!dto.clienteId && !dto.precioUnitario && !dto.observaciones) {
      throw new BadRequestException(
        'Debes enviar al menos clienteId, precioUnitario u observaciones',
      );
    }

    const recrear = (dto.recrearMovimiento ?? 'false').toLowerCase() === 'true';

    return this.ds.transaction(async (m) => {
      const pRepo = m.getRepository(Pedido);
      const movRep = m.getRepository(MovimientoCuentaCorriente);

      const pedido = await pRepo.findOne({
        where: { tenantId, id: dto.pedidoId },
      });
      if (!pedido) throw new NotFoundException('Pedido no encontrado');

      // Debe existir confirmación previa (movimiento VENTA asociado)
      let mov = await movRep.findOne({
        where: { tenantId, tipo: 'VENTA', pedidoId: pedido.id },
      });
      if (!mov) {
        throw new ConflictException({
          code: 'NO_CONFIRMADO',
          message:
            'Este pedido aún no fue confirmado. Usa /pedidos/confirmar primero.',
        });
      }

      // Datos originales (para ajustar saldos)
      const oldClienteId = mov.clienteId;
      const oldMontoNum = Number(mov.monto ?? 0);

      // Aplicar cambios en pedido
      if (dto.clienteId) pedido.clienteId = dto.clienteId;

      let newTotalNum: number | undefined;
      if (dto.precioUnitario) {
        const precioUnit = Number(dto.precioUnitario);
        if (!isFinite(precioUnit) || precioUnit <= 0) {
          throw new BadRequestException('precioUnitario inválido');
        }
        const kg = Number(pedido.kg ?? 0);
        newTotalNum = +(kg * precioUnit).toFixed(2);
        pedido.precioUnitario = precioUnit.toFixed(2);
        pedido.precioTotal = newTotalNum.toFixed(2);
      } else {
        // Si no cambiaron el precio, usamos el monto del movimiento como “total actual”
        newTotalNum = oldMontoNum;
      }

      if (dto.observaciones) {
        pedido.observaciones = [pedido.observaciones, dto.observaciones]
          .filter(Boolean)
          .join(' | ');
      }

      await pRepo.save(pedido);

      // Actualizar o recrear movimiento
      if (recrear) {
        await movRep.remove(mov);
        mov = movRep.create({
          tenantId,
          clienteId: pedido.clienteId,
          tipo: 'VENTA',
          fecha: pedido.fechaRemito ?? new Date(),
          monto: newTotalNum!.toFixed(2),
          pedidoId: pedido.id,
        });
        await movRep.save(mov);
      } else {
        if (dto.clienteId) mov.clienteId = pedido.clienteId;
        if (dto.precioUnitario) mov.monto = newTotalNum!.toFixed(2);
        mov.fecha = pedido.fechaRemito ?? mov.fecha;
        await movRep.save(mov);
      }

      // === Ajuste de cuentas corrientes (atómico) ===
      const upsertSaldo = async (clienteId: string, delta: number) => {
        if (!delta) return;
        await m.query(
          `
        INSERT INTO cuenta_corriente (tenant_id, cliente_id, saldo, created_at, updated_at)
        VALUES ($1, $2, $3, now(), now())
        ON CONFLICT (tenant_id, cliente_id)
        DO UPDATE SET saldo = (cuenta_corriente.saldo::numeric) + EXCLUDED.saldo,
                      updated_at = now();
        `,
          [tenantId, clienteId, delta.toFixed(2)],
        );
      };

      const newClienteId = pedido.clienteId;

      if (oldClienteId === newClienteId) {
        // Mismo cliente: ajustar solo la diferencia
        const delta = (newTotalNum ?? 0) - oldMontoNum;
        await upsertSaldo(newClienteId, delta);
      } else {
        // Cliente cambiado: restar del viejo y sumar al nuevo
        await upsertSaldo(oldClienteId, -oldMontoNum);
        await upsertSaldo(newClienteId, newTotalNum ?? 0);
      }

      return {
        ok: true,
        pedido,
        movimiento: mov,
      };
    });
  }

  async getPorRemito(numeroRemito: string) {
    const tenantId = this.tenantId();

    // Traemos todos los pedidos de ese remito (con cliente eager)
    const pedidos = await this.repo.find({
      where: { tenantId, numeroRemito },
      order: { fechaRemito: 'ASC', articulo: 'ASC', createdAt: 'ASC' },
    });

    if (!pedidos.length) {
      throw new NotFoundException('No hay pedidos para ese número de remito');
    }

    // En la práctica, el remito corresponde a un único cliente.
    // Igual validamos por si hubiera inconsistencias:
    const clienteIds = Array.from(new Set(pedidos.map((p) => p.clienteId)));
    const clienteId = clienteIds[0];
    const cliente = pedidos[0].cliente; // eager

    // Saldo de cuenta corriente (si no existe aún, saldo 0.00)
    const ctacte = await this.ccRepo.findOne({
      where: { tenantId, clienteId },
    });

    const saldo = ctacte?.saldo ?? '0.00';

    const warning =
      clienteIds.length > 1
        ? `Advertencia: el remito "${numeroRemito}" tiene más de un cliente asociado (${clienteIds.length}). Se muestra el saldo del primer cliente.`
        : undefined;

    return {
      ok: true,
      numeroRemito,
      cliente,
      saldoCuentaCorriente: saldo,
      warning,
      filas: pedidos, // las mismas columnas que ves en la grilla (eager trae cliente)
    };
  }

  async getPorCliente(params: {
    clienteId: string;
    fechaDesde: string;
    fechaHasta: string;
  }) {
    const tenantId = this.tenantId();
    const { clienteId, fechaDesde, fechaHasta } = params || ({} as any);

    if (!clienteId) {
      throw new BadRequestException('clienteId es requerido');
    }
    // Validar fechas básicas (YYYY-MM-DD)
    const fd = new Date(fechaDesde);
    const fh = new Date(fechaHasta);
    if (Number.isNaN(fd.getTime()) || Number.isNaN(fh.getTime())) {
      throw new BadRequestException(
        'fechaDesde/fechaHasta inválidas (YYYY-MM-DD)',
      );
    }
    if (fd > fh) {
      throw new BadRequestException(
        'fechaDesde no puede ser mayor que fechaHasta',
      );
    }

    // Traer todos los pedidos del cliente dentro del rango (con cliente eager)
    const pedidos = await this.repo.find({
      where: {
        tenantId,
        clienteId,
        fechaRemito: Between(fechaDesde, fechaHasta),
      },
      order: { fechaRemito: 'ASC', articulo: 'ASC', createdAt: 'ASC' },
    });

    if (!pedidos.length) {
      throw new NotFoundException(
        'No hay pedidos para ese cliente en el rango indicado',
      );
    }

    // Cliente (eager en los pedidos)
    const cliente = pedidos[0].cliente;

    // Saldo de cuenta corriente (si no existe aún, saldo 0.00)
    const ctacte = await this.ccRepo.findOne({
      where: { tenantId, clienteId },
    });
    const saldo = ctacte?.saldo ?? '0.00';

    // Agrupar por número de remito para devolver "exactamente lo mismo por remito"
    const grupos = new Map<string, typeof pedidos>();
    for (const p of pedidos) {
      const key = p.numeroRemito;
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(p);
    }

    // Construimos un bloque por cada remito, con la misma forma que getPorRemito
    const remitos = Array.from(grupos.entries()).map(
      ([numeroRemito, filas]) => ({
        ok: true,
        numeroRemito,
        cliente,
        saldoCuentaCorriente: saldo,
        warning: undefined, // como filtramos por clienteId, no debería haber múltiples clientes por remito
        filas, // mismas columnas que ves en la grilla (eager trae cliente)
      }),
    );

    return {
      ok: true,
      cliente,
      saldoCuentaCorriente: saldo,
      fechaDesde,
      fechaHasta,
      remitos, // array de bloques "idénticos" al getPorRemito original, uno por remito
    };
  }
}
