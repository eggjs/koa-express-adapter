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
        return target[name] || target.req[name];
      },
    });
    const eRes = new Response(ctx);
    const eResAdapter = new Proxy(eRes, {
      get(target, name) {
        return target[name] || target.res[name];
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
