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
var ImportacionesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportacionesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const XLSX = require("xlsx");
const request_context_1 = require("../../common/request-context");
const import_map_entity_1 = require("./entities/import-map.entity");
const cliente_entity_1 = require("../clientes/cliente.entity");
const unidad_entity_1 = require("../unidades/unidad.entity");
const producto_entity_1 = require("../productos/producto.entity");
const remitos_service_1 = require("../remitos/remitos.service");
function normStr(v) {
    if (v === null || v === undefined)
        return undefined;
    const s = String(v).trim();
    return s.length ? s : undefined;
}
function onlyDigits(s) { return s ? s.replace(/\D+/g, '') : undefined; }
// ---- Normalización de encabezados ------------------------------------------------
const HEADER_ALIASES = {
    FECHA_REMITO: ['FECHA_REMITO', 'FECHA REMITO', 'FECHA', 'F.REMITO', 'FECHA_R', 'FEC REMITO'],
    REMITO: ['REMITO', 'NRO_REMITO', 'NRO REMITO', 'REMITO NRO', 'REMITO Nº', 'REM/NRO', 'REM', 'NREMITO', 'NUM REMITO'],
    CLIENTE: ['CLIENTE', 'RAZON SOCIAL', 'RAZÓN SOCIAL', 'NOMBRE CLIENTE', 'NOMBRE'],
    CUIT_CLIENTE: ['CUIT_CLIENTE', 'CUIT CLIENTE', 'CUIT', 'C.U.I.T', 'C.U.I.T.'],
    PRODUCTO: ['PRODUCTO', 'DESCRIPCION', 'DESCRIPCIÓN', 'DETALLE', 'ARTICULO', 'ARTÍCULO', 'CORTE', 'ITEM', '0'],
    UNID_MEDIDA: ['UNID_MEDIDA', 'UNIDAD', 'UNIDAD MEDIDA', 'UM', 'U.M.', 'MEDIDA'],
    KILOS: ['KILOS', 'KG', 'KGR', 'PESO', 'PESO_KG', 'PESO KG'],
    CANTIDAD: ['CANTIDAD', 'CANT', 'CANT.', 'UNIDADES', 'U', 'CANT UN', 'CANTIDAD UN'],
    ESPECIE: ['ESPECIE'],
    CHAPA: ['CHAPA', 'NRO CHAPA', 'N° CHAPA'],
    TROPA: ['TROPA', 'NRO TROPA', 'N° TROPA'],
    IVA: ['IVA'],
    COND_IVA: ['COND_IVA', 'COND IVA', 'CONDICION IVA', 'CONDICIÓN IVA'],
    SUBCATEGORIA: ['SUBCATEGORIA', 'SUBCATEGORÍA', 'SUBCAT', 'SUB-CATEGORIA'],
    NRO_CLIENTE: ['NRO_CLIENTE', 'NRO CLIENTE', 'ID CLIENTE', 'COD CLIENTE', 'CÓD CLIENTE'],
};
function stripAccents(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function canon(s) {
    return stripAccents(s).replace(/\s+|[.\-_/]/g, '').toUpperCase();
}
function buildHeaderResolver(firstRowKeys) {
    // Mapeo de "canon(header)" => header original
    const dict = new Map();
    for (const k of firstRowKeys)
        dict.set(canon(k), k);
    // Para cada clave canónica de negocio (PRODUCTO, REMITO, etc.), elegimos el alias presente.
    const pick = {};
    for (const want of Object.keys(HEADER_ALIASES)) {
        const aliases = HEADER_ALIASES[want];
        pick[want] = aliases.map(a => dict.get(canon(a))).find(Boolean);
    }
    // Helper get: lee un valor por clave semántica
    const get = (row, key) => {
        const col = pick[key];
        return col ? row[col] : undefined;
    };
    return { pick, get, dict };
}
// -----------------------------------------------------------------------------
let ImportacionesService = ImportacionesService_1 = class ImportacionesService {
    constructor(mapRepo, clientes, unidades, productos, remitosService) {
        this.mapRepo = mapRepo;
        this.clientes = clientes;
        this.unidades = unidades;
        this.productos = productos;
        this.remitosService = remitosService;
        this.logger = new common_1.Logger(ImportacionesService_1.name);
    }
    async importDetalleRemitos(buffer) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const sheet = wb.Sheets['Detalle Remitos'];
        if (!sheet)
            throw new common_1.BadRequestException('Hoja "Detalle Remitos" no encontrada');
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
        if (!rows.length)
            throw new common_1.BadRequestException('La hoja "Detalle Remitos" está vacía');
        const firstKeys = Object.keys(rows[0] ?? {});
        const { pick, get } = buildHeaderResolver(firstKeys);
        // Validación flexible de columnas mínimas
        const missing = [];
        // requeridos duros:
        for (const k of ['FECHA_REMITO', 'REMITO', 'CLIENTE', 'UNID_MEDIDA']) {
            if (!pick[k])
                missing.push(k);
        }
        // PRODUCTO: obligatorio pero aceptamos sinónimos (ya resueltos arriba)
        if (!pick.PRODUCTO)
            missing.push('PRODUCTO');
        // KILOS/CANTIDAD: no exigimos ambos; al menos uno debe existir
        if (!pick.KILOS && !pick.CANTIDAD)
            missing.push('KILOS|CANTIDAD');
        if (missing.length) {
            throw new common_1.BadRequestException(`Faltan columnas requeridas: ${missing.join(', ')}. Encabezados detectados: ${firstKeys.join(' | ')}`);
        }
        // Caches
        const cache = {
            clienteByCuit: new Map(),
            clienteByNombre: new Map(),
            unidadBySimbolo: new Map(),
            productoByKey: new Map(),
        };
        // A) asegurar Unidad (primero por nombre, luego por símbolo) según tu entidad Unidad
        const ensureUnidad = async (nombreUM, simbolo) => {
            // tu entidad Unidad tiene @Index(['tenant_id','nombre'], { unique: true })
            let u = await this.unidades.findOne({ where: { tenant_id: tenantId, nombre: nombreUM } });
            if (!u && simbolo) {
                u = await this.unidades.findOne({ where: { tenant_id: tenantId, simbolo: simbolo.toLowerCase() } });
            }
            if (!u) {
                u = this.unidades.create({ tenant_id: tenantId, nombre: nombreUM, simbolo: simbolo?.toLowerCase() ?? null });
                u = await this.unidades.save(u);
            }
            return u.id;
        };
        const ensureCliente = async (nombre, cuitRaw) => {
            const cuit = onlyDigits(normStr(cuitRaw));
            if (cuit) {
                if (cache.clienteByCuit.has(cuit))
                    return cache.clienteByCuit.get(cuit);
                let c = await this.clientes.findOne({ where: { tenant_id: tenantId, cuit } });
                if (!c) {
                    c = this.clientes.create({ tenant_id: tenantId, nombre: normStr(nombre) ?? `Cliente ${cuit}`, cuit, activo: true });
                    c = await this.clientes.save(c);
                }
                cache.clienteByCuit.set(cuit, c.id);
                return c.id;
            }
            else {
                const key = (normStr(nombre) ?? 'Cliente sin nombre').toUpperCase();
                if (cache.clienteByNombre.has(key))
                    return cache.clienteByNombre.get(key);
                let c = await this.clientes.findOne({ where: { tenant_id: tenantId, nombre: key } });
                if (!c) {
                    c = this.clientes.create({ tenant_id: tenantId, nombre: key, activo: true });
                    c = await this.clientes.save(c);
                }
                cache.clienteByNombre.set(key, c.id);
                return c.id;
            }
        };
        // B) asegurar Producto por (nombre + unidadId); SKU queda null
        const ensureProducto = async (nombre, unidadId) => {
            let p = await this.productos.findOne({ where: { tenant_id: tenantId, nombre, unidadId } });
            if (!p) {
                p = this.productos.create({ tenant_id: tenantId, nombre, unidadId, sku: null, activo: true });
                p = await this.productos.save(p);
            }
            return p.id;
        };
        const groups = new Map();
        let created = { clientes: 0, unidades: 0, productos: 0, remitos: 0, items: 0, skipped: 0 };
        const before = {
            clientes: await this.clientes.count({ where: { tenant_id: tenantId } }),
            unidades: await this.unidades.count({ where: { tenant_id: tenantId } }),
            productos: await this.productos.count({ where: { tenant_id: tenantId } }),
        };
        for (const r of rows) {
            const remitoExtRaw = get(r, 'REMITO');
            const remitoExt = normStr(remitoExtRaw ?? '');
            if (!remitoExt)
                continue;
            // idempotencia: si ya mapeamos ese remito externo, saltar
            const already = await this.mapRepo.findOne({ where: { tenant_id: tenantId, source: 'Detalle Remitos', external_id: remitoExt } });
            if (already) {
                created.skipped++;
                continue;
            }
            const fechaVal = get(r, 'FECHA_REMITO');
            const d = fechaVal instanceof Date ? fechaVal : new Date(fechaVal);
            const fechaISO = isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : undefined;
            if (!fechaISO)
                throw new common_1.BadRequestException(`FECHA_REMITO inválida para remito ${remitoExt}`);
            const umRaw = (normStr(get(r, 'UNID_MEDIDA')) || '').toLowerCase();
            const isPeso = /k|kilo|kg|kgr|peso/.test(umRaw);
            const nombreUM = isPeso ? 'Kilogramo' : 'Unidad';
            const simboloUM = isPeso ? 'kg' : 'un';
            const unidadId = await ensureUnidad(nombreUM, simboloUM);
            const clienteNombre = normStr(get(r, 'CLIENTE'));
            const clienteCuit = normStr(get(r, 'CUIT_CLIENTE'));
            const clienteId = await ensureCliente(clienteNombre, clienteCuit);
            const prodNombre = normStr(get(r, 'PRODUCTO')) ?? 'Producto';
            const productoId = await ensureProducto(prodNombre, unidadId);
            // cantidad: según UM
            const kilosVal = get(r, 'KILOS');
            const cantVal = get(r, 'CANTIDAD');
            const num = isPeso ? Number(kilosVal ?? cantVal ?? 0) : Number(cantVal ?? kilosVal ?? 0);
            const cantidad = (isFinite(num) ? num : 0).toFixed(3);
            const precio = '0.00';
            const descParts = [prodNombre];
            const chapa = normStr(get(r, 'CHAPA'));
            if (chapa)
                descParts.push(`CHAPA ${chapa}`);
            const tropa = normStr(String(get(r, 'TROPA') ?? ''));
            if (tropa)
                descParts.push(`TROPA ${tropa}`);
            const especie = normStr(get(r, 'ESPECIE'));
            if (especie)
                descParts.push(`(${especie})`);
            const descripcion = descParts.join(' - ');
            const key = `${remitoExt}|${fechaISO}|${clienteId}`;
            if (!groups.has(key)) {
                const extra = [];
                const nroCli = normStr(get(r, 'NRO_CLIENTE'));
                if (nroCli)
                    extra.push(`NRO_CLIENTE:${nroCli}`);
                const iva = normStr(get(r, 'IVA'));
                if (iva)
                    extra.push(`IVA:${iva}`);
                const cond = normStr(get(r, 'COND_IVA'));
                if (cond)
                    extra.push(`COND_IVA:${cond}`);
                const subcat = normStr(get(r, 'SUBCATEGORIA'));
                if (subcat)
                    extra.push(`SUBCAT:${subcat}`);
                groups.set(key, {
                    externalRemito: remitoExt,
                    fecha: fechaISO,
                    clienteId,
                    obsExtra: `EXTERNAL:${remitoExt}${extra.length ? ' | ' + extra.join(' | ') : ''}`,
                    items: [],
                });
            }
            groups.get(key).items.push({ productoId, descripcion, cantidad, precio });
        }
        created.clientes = Math.max(0, (await this.clientes.count({ where: { tenant_id: tenantId } })) - before.clientes);
        created.unidades = Math.max(0, (await this.unidades.count({ where: { tenant_id: tenantId } })) - before.unidades);
        created.productos = Math.max(0, (await this.productos.count({ where: { tenant_id: tenantId } })) - before.productos);
        const results = [];
        for (const g of groups.values()) {
            try {
                const saved = await this.remitosService.create({
                    fecha: g.fecha,
                    clienteId: g.clienteId,
                    observaciones: g.obsExtra,
                    items: g.items,
                });
                created.remitos += 1;
                created.items += g.items.length;
                await this.mapRepo.save(this.mapRepo.create({
                    tenant_id: tenantId,
                    source: 'Detalle Remitos',
                    external_id: g.externalRemito,
                    entity: 'REMITO',
                    entityId: saved.id,
                }));
                results.push({ external: g.externalRemito, remitoId: saved.id, createdItems: g.items.length });
            }
            catch (e) {
                results.push({ external: g.externalRemito, error: e?.message || 'error' });
            }
        }
        return { ok: true, counts: created, remitos: results };
    }
};
exports.ImportacionesService = ImportacionesService;
exports.ImportacionesService = ImportacionesService = ImportacionesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(import_map_entity_1.ImportMap)),
    __param(1, (0, typeorm_1.InjectRepository)(cliente_entity_1.Cliente)),
    __param(2, (0, typeorm_1.InjectRepository)(unidad_entity_1.Unidad)),
    __param(3, (0, typeorm_1.InjectRepository)(producto_entity_1.Producto)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        remitos_service_1.RemitosService])
], ImportacionesService);
//# sourceMappingURL=importaciones.service.js.map