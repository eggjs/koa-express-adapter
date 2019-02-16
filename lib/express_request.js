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

  acceptsEncoding(...args) {
    return this.ctx.acceptsEncodings(...args);
  }
  get acceptsEncodings() {
    return this.acceptsEncoding;
  }

  acceptsLanguage(...args) {
    return this.ctx.acceptsLanguages(...args);
  }
  get acceptsLanguages() {
    return this.acceptsLanguage;
  }
}

module.exports = ExpressRequest;
