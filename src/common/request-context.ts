import { AsyncLocalStorage } from 'node:async_hooks';

type Ctx = { tenantId?: number; userId?: number; };

export class RequestContext {
  private static als = new AsyncLocalStorage<Ctx>();

  static run<T>(ctx: Ctx, fn: () => T): T {
    return this.als.run(ctx, fn);
  }

  static get(): Ctx | undefined {
    return this.als.getStore();
  }

  static tenantId(): number | undefined {
    return this.get()?.tenantId;
  }

  static userId(): number | undefined {
    return this.get()?.userId;
  }
}
