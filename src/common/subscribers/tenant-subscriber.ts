import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { RequestContext } from '../request-context';
import { BaseTenantEntity } from '../entities/base-tenant.entity';

@EventSubscriber()
export class TenantScopeSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  // Antes de insertar, si la entidad tiene tenant_id y no está seteado, lo copia del contexto
  beforeInsert(event: InsertEvent<any>) {
    const entity = event.entity as Partial<BaseTenantEntity>;
    if (entity && 'tenant_id' in entity && (entity.tenant_id === undefined || entity.tenant_id === null)) {
      const tid = RequestContext.tenantId();
      if (typeof tid === 'number') {
        (entity as any).tenant_id = tid;
      }
    }
  }
}
