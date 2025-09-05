"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const tenant_entity_1 = require("./modules/tenants/tenant.entity");
const user_entity_1 = require("./modules/users/user.entity");
const role_entity_1 = require("./modules/roles/role.entity");
const user_role_entity_1 = require("./modules/roles/user-role.entity");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const users_module_1 = require("./modules/users/users.module");
const roles_module_1 = require("./modules/roles/roles.module");
const auth_module_1 = require("./modules/auth/auth.module");
const request_context_middleware_1 = require("./common/middleware/request-context.middleware");
const tenant_subscriber_1 = require("./common/subscribers/tenant-subscriber");
const health_controller_1 = require("./health.controller");
const clientes_module_1 = require("./modules/clientes/clientes.module");
const unidades_module_1 = require("./modules/unidades/unidades.module");
const productos_module_1 = require("./modules/productos/productos.module");
const precios_module_1 = require("./modules/precios/precios.module");
const movimientos_module_1 = require("./modules/movimientos/movimientos.module");
const remitos_module_1 = require("./modules/remitos/remitos.module");
const cobros_module_1 = require("./modules/cobros/cobros.module");
const cuenta_corriente_module_1 = require("./modules/cuenta-corriente/cuenta-corriente.module");
const ajustes_module_1 = require("./modules/ajustes/ajustes.module");
const importaciones_module_1 = require("./modules/importaciones/importaciones.module");
const reportes_module_1 = require("./modules/reportes/reportes.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_context_middleware_1.RequestContextMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    type: 'postgres',
                    url: cfg.get('DATABASE_URL'),
                    autoLoadEntities: true,
                    synchronize: true, // DEV: true; PROD: usar migraciones
                    logging: false
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature([tenant_entity_1.Tenant, user_entity_1.User, role_entity_1.Role, user_role_entity_1.UserRole]),
            roles_module_1.RolesModule,
            tenants_module_1.TenantsModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            clientes_module_1.ClientesModule,
            unidades_module_1.UnidadesModule,
            productos_module_1.ProductosModule,
            precios_module_1.PreciosModule,
            movimientos_module_1.MovimientosModule,
            remitos_module_1.RemitosModule,
            cobros_module_1.CobrosModule,
            cuenta_corriente_module_1.CuentaCorrienteModule,
            ajustes_module_1.AjustesModule,
            importaciones_module_1.ImportacionesModule,
            reportes_module_1.ReportesModule,
        ],
        providers: [tenant_subscriber_1.TenantScopeSubscriber],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map