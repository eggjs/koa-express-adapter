'use strict';

const inject = require('./inject');

module.exports = expressMiddleware => {
  return async (ctx, next) => {
    inject(ctx);

    // https://github.com/koajs/koa/blob/master/docs/troubleshooting.md#whenever-i-try-to-access-my-route-it-sends-back-a-404
    // The default status of koa is 404, but express is 200
    ctx.status = 200;

    if (expressMiddleware.length === 3) {
      await callback2asyncfunction(expressMiddleware)(ctx.eReq, ctx.eRes);
      return await next();
    }

    expressMiddleware(ctx.eReq, ctx.eRes);
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
