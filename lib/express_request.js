'use strict';

class ExpressRequest {
  constructor(ctx) {
    this.ctx = ctx;
    this.req = ctx.req;
  }

  accepts(...args) {
    const r = this.ctx.accepts(...args);
    console.log(r);
    return r;
  }

}

module.exports = ExpressRequest;
