'use strict';

class ExpressResponse {
  constructor(ctx) {
    this.ctx = ctx;
    this.res = ctx.res;
  }

  set(...args) {
    this.ctx.set(...args);
  }
  get header() {
    return this.set;
  }

  send(body) {
    this.ctx.body = body;
  }

  end(...args) {
    // prevent koa response again
    this.ctx.respond = false;
    this.res.end(...args);
  }
}

module.exports = ExpressResponse;
