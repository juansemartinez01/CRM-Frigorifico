"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestContext = void 0;
const node_async_hooks_1 = require("node:async_hooks");
class RequestContext {
    static run(ctx, fn) {
        return this.als.run(ctx, fn);
    }
    static get() {
        return this.als.getStore();
    }
    static tenantId() {
        return this.get()?.tenantId;
    }
    static userId() {
        return this.get()?.userId;
    }
}
exports.RequestContext = RequestContext;
RequestContext.als = new node_async_hooks_1.AsyncLocalStorage();
//# sourceMappingURL=request-context.js.map