'use strict';

const Request = require('./express_request');
const Response = require('./express_response');

const EXPRESS_REQUEST = Symbol('Context@eReq');
const EXPRESS_RESPONSE = Symbol('Context@eRes');

module.exports = ctx => {

  if (!ctx.eReq) {
    Object.defineProperty(ctx, 'eReq', {
      get() {
        if (this[EXPRESS_REQUEST]) return this[EXPRESS_REQUEST];

        const eReq = new Request(this);
        this[EXPRESS_REQUEST] = new Proxy(eReq, {
          get(target, name) {
            let property = target[name];
            if (property) return property;

            const req = target.nodeRequest;
            property = req[name];
            return typeof property === 'function' ? property.bind(req) : property;
          },
        });
        return this[EXPRESS_REQUEST];
      },
    });
  }

  if (!ctx.eRes) {
    Object.defineProperty(ctx, 'eRes', {
      get() {
        if (this[EXPRESS_RESPONSE]) return this[EXPRESS_RESPONSE];

        const eRes = new Response(this);
        this[EXPRESS_RESPONSE] = new Proxy(eRes, {
          get(target, name) {
            let property = target[name];
            if (property) return property;

            const req = target.nodeResponse;
            property = req[name];
            return typeof property === 'function' ? property.bind(req) : property;
          },
        });
        return this[EXPRESS_RESPONSE];
      },
    });
  }
};
