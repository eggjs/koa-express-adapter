'use strict';

const Request = require('./express_request');
const Response = require('./express_response');

module.exports = expressMiddleware => {
  return async (ctx, next) => {
    // https://github.com/koajs/koa/blob/master/docs/troubleshooting.md#whenever-i-try-to-access-my-route-it-sends-back-a-404
    // The default status of koa is 404, but express is 200
    ctx.status = 200;

    const eReq = new Request(ctx);
    const eReqAdapter = new Proxy(eReq, {
      get(target, name) {
        let property = target[name];
        if (property) return property;

        const req = target.nodeRequest;
        property = req[name];
        return typeof property === 'function' ? property.bind(req) : property;
      },
    });
    const eRes = new Response(ctx);
    const eResAdapter = new Proxy(eRes, {
      get(target, name) {
        let property = target[name];
        if (property) return property;

        const res = target.nodeResponse;
        property = res[name];
        return typeof property === 'function' ? property.bind(res) : property;
      },
    });

    if (expressMiddleware.length === 3) {
      await callback2asyncfunction(expressMiddleware)(eReqAdapter, eResAdapter);
      return await next();
    }

    expressMiddleware(eReqAdapter, eResAdapter);
  };
};

function callback2asyncfunction(cb) {
  return async (...args) => new Promise((resolve, reject) => {
    cb(...args, err => {
      if (err) return reject(err);
      resolve();
    });
  });
}
