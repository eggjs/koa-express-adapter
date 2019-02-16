'use strict';

class ExpressResponse {
  constructor(ctx) {
    this.ctx = ctx;
    this.res = ctx.res;
  }

  end(...args) {
    this.ctx.respond = false;
    console.log(1, this.res.statusCode);
    this.res.end(...args);
  }
}

module.exports = ExpressResponse;
