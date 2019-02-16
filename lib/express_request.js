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

  get(name) {
    if (!name) throw new TypeError('name argument is required to req.get');
    if (typeof name !== 'string') throw new TypeError('name must be a string to req.get');
    // The default value of express is undefined
    return this.ctx.get(name) || undefined;
  }
  get header() {
    return this.get;
  }
}

module.exports = ExpressRequest;
