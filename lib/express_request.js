'use strict';

class ExpressRequest {
  constructor(ctx) {
    this.ctx = ctx;
    this.req = ctx.req;
  }

  accepts(...args) {
    return this.ctx.accepts(...args);
  }

  acceptsCharset(...args) {
    return this.ctx.acceptsCharsets(...args);
  }

  get acceptsCharsets() {
    return this.acceptsCharset;
  }

}

module.exports = ExpressRequest;
