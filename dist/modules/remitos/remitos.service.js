"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemitosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const request_context_1 = require("../../common/request-context");
const remito_venta_entity_1 = require("./entities/remito-venta.entity");
const remito_item_entity_1 = require("./entities/remito-item.entity");
const movimientos_service_1 = require("../movimientos/movimientos.service");
const producto_entity_1 = require("../productos/producto.entity");
const cliente_entity_1 = require("../clientes/cliente.entity");
function toMoney(n) {
    return n.toFixed(2);
}
let RemitosService = class RemitosService {
    constructor(remitos, items, productos, clientes, movs, dataSource) {
        this.remitos = remitos;
        this.items = items;
        this.productos = productos;
        this.clientes = clientes;
        this.movs = movs;
        this.dataSource = dataSource;
    }
    async ensureCliente(tenantId, id) {
        const c = await this.clientes.findOne({ where: { id, tenant_id: tenantId } });
        if (!c)
            throw new common_1.NotFoundException('Cliente no encontrado');
    }
    async ensureProducto(tenantId, id) {
        const p = await this.productos.findOne({ where: { id, tenant_id: tenantId } });
        if (!p)
            throw new common_1.NotFoundException(`Producto ${id} no encontrado`);
        return p;
    }
    calcularTotales(items) {
        let subtotal = 0;
        for (const it of items) {
            const s = Number(it.cantidad) * Number(it.precio);
            subtotal += s;
        }
        const total = subtotal;
        return { subtotal: toMoney(subtotal), total: toMoney(total) };
    }
    async create(dto) {
        const tenantId = request_context_1.RequestContext.tenantId();
        await this.ensureCliente(tenantId, dto.clienteId);
        const saved = await this.dataSource.transaction(async (manager) => {
            const remRepo = manager.getRepository(remito_venta_entity_1.RemitoVenta);
            const itemRepo = manager.getRepository(remito_item_entity_1.RemitoItem);
            const prodRepo = manager.getRepository(producto_entity_1.Producto);
            const numero = await this.nextNumeroLocked(manager, tenantId);
            // Armar ítems normalizando decimales
            const items = [];
            for (const raw of dto.items) {
                const prod = await prodRepo.findOne({ where: { id: raw.productoId, tenant_id: tenantId } });
                if (!prod)
                    throw new common_1.NotFoundException(`Producto ${raw.productoId} no encontrado`);
                const desc = raw.descripcion ?? prod.nombre;
                const cantNum = Number(raw.cantidad);
                const precNum = Number(raw.precio);
                if (!isFinite(cantNum) || !isFinite(precNum)) {
                    throw new common_1.BadRequestException('cantidad/precio inválidos');
                }
                const cantidad = cantNum.toFixed(3);
                const precio = precNum.toFixed(2);
                const subtotal = (cantNum * precNum).toFixed(2);
                items.push(itemRepo.create({
                    tenant_id: tenantId,
                    productoId: raw.productoId,
                    descripcion: desc,
                    cantidad,
                    precio,
                    subtotal,
                }));
            }
            const subtotalNum = items.reduce((acc, it) => acc + Number(it.subtotal), 0);
            const totales = { subtotal: subtotalNum.toFixed(2), total: subtotalNum.toFixed(2) };
            const rem = remRepo.create({
                tenant_id: tenantId,
                fecha: dto.fecha,
                numero,
                clienteId: dto.clienteId,
                usuarioId: dto.usuarioId ?? null,
                observaciones: dto.observaciones,
                subtotal: totales.subtotal,
                total: totales.total,
                estado: 'CONFIRMADO',
                items,
            });
            return remRepo.save(rem);
        });
        // Movimiento en CC fuera de la tx (si querés, también puede ir adentro)
        await this.movs.crear({
            clienteId: saved.clienteId,
            fecha: saved.fecha,
            tipo: 'DEBE',
            origen: 'REMITO',
            referenciaId: saved.id,
            monto: saved.total,
            observaciones: `Remito ${saved.numero}`,
        });
        return saved;
    }
    async findAll(q) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const qb = this.remitos.createQueryBuilder('r')
            .leftJoinAndSelect('r.items', 'i')
            .leftJoinAndSelect('r.cliente', 'c')
            .where('r.tenant_id = :tenantId', { tenantId });
        if (q.clienteId)
            qb.andWhere('r.clienteId = :cid', { cid: q.clienteId });
        if (q.numeroLike)
            qb.andWhere('CAST(r.numero AS TEXT) ILIKE :n', { n: `%${q.numeroLike}%` });
        if (q.estado)
            qb.andWhere('r.estado = :e', { e: q.estado });
        if (q.desde)
            qb.andWhere('r.fecha >= :d', { d: q.desde });
        if (q.hasta)
            qb.andWhere('r.fecha <= :h', { h: q.hasta });
        qb.orderBy(`r.${q.orderBy ?? 'fecha'}`, (q.order ?? 'DESC'));
        const page = q.page ?? 1, limit = q.limit ?? 20;
        qb.skip((page - 1) * limit).take(limit);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }
    async findOne(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const r = await this.remitos.findOne({ where: { id, tenant_id: tenantId }, relations: ['items', 'cliente'] });
        if (!r)
            throw new common_1.NotFoundException('Remito no encontrado');
        return r;
    }
    async update(id, dto) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const rem = await this.findOne(id);
        if (dto.clienteId)
            await this.ensureCliente(tenantId, dto.clienteId);
        // Reemplazo de detalle si viene items
        if (dto.items) {
            // borrar items actuales y crear nuevos
            await this.items.delete({ tenant_id: tenantId, remitoId: rem.id });
            const nuevos = [];
            for (const raw of dto.items) {
                const prod = await this.ensureProducto(tenantId, raw.productoId);
                const descripcion = raw.descripcion ?? prod.nombre;
                const subtotal = toMoney(Number(raw.cantidad) * Number(raw.precio));
                nuevos.push(this.items.create({
                    tenant_id: tenantId,
                    remitoId: rem.id,
                    productoId: raw.productoId,
                    descripcion,
                    cantidad: raw.cantidad,
                    precio: raw.precio,
                    subtotal,
                }));
            }
            rem.items = await this.items.save(nuevos);
            const tot = this.calcularTotales(nuevos.map(i => ({ cantidad: i.cantidad, precio: i.precio })));
            rem.subtotal = tot.subtotal;
            rem.total = tot.total;
        }
        Object.assign(rem, {
            fecha: dto.fecha ?? rem.fecha,
            clienteId: dto.clienteId ?? rem.clienteId,
            usuarioId: dto.usuarioId ?? rem.usuarioId,
            observaciones: dto.observaciones ?? rem.observaciones,
        });
        const updated = await this.remitos.save(rem);
        // Ajuste en CC: revertemos el asiento anterior y cargamos nuevo con el total actualizado
        await this.movs.revertirDe('REMITO', updated.id, 'Reverso por actualización de remito');
        await this.movs.crear({
            clienteId: updated.clienteId,
            fecha: updated.fecha,
            tipo: 'DEBE',
            origen: 'REMITO',
            referenciaId: updated.id,
            monto: updated.total,
            observaciones: `Remito ${updated.numero} (actualizado)`,
        });
        return updated;
    }
    async remove(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const rem = await this.findOne(id);
        await this.remitos.softDelete({ id: rem.id, tenant_id: tenantId });
        // Contra-asiento HABER para anular deuda
        await this.movs.revertirDe('REMITO', rem.id, 'Reverso por anulación de remito');
        return { ok: true };
    }
    async nextNumeroLocked(manager, tenantId) {
        // Lock por tenant (se libera al cerrar la transacción)
        await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [1001, tenantId]);
        // 👇 Incluir borrados lógicos para NO reutilizar números
        const result = await manager
            .getRepository(remito_venta_entity_1.RemitoVenta)
            .createQueryBuilder('r')
            .withDeleted() // <<=== IMPORTANTE
            .select('COALESCE(MAX(r.numero), 0)', 'max')
            .where('r.tenant_id = :tenantId', { tenantId })
            .getRawOne();
        const max = result?.max ?? '0';
        return Number(max) + 1;
    }
};
exports.RemitosService = RemitosService;
exports.RemitosService = RemitosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(remito_venta_entity_1.RemitoVenta)),
    __param(1, (0, typeorm_1.InjectRepository)(remito_item_entity_1.RemitoItem)),
    __param(2, (0, typeorm_1.InjectRepository)(producto_entity_1.Producto)),
    __param(3, (0, typeorm_1.InjectRepository)(cliente_entity_1.Cliente)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        movimientos_service_1.MovimientosService,
        typeorm_2.DataSource])
], RemitosService);
//# sourceMappingURL=remitos.service.js.map