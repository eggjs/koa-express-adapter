'use strict';

class ExpressResponse {
  constructor(ctx) {
    this.ctx = ctx;
    this.res = ctx.res;
  }

  end(...args) {
    this.ctx.respond = false;
    this.res.end(...args);
  }
}

module.exports = ExpressResponse;
