'use strict';

class ExpressRequest {
  constructor(ctx) {
    this.ctx = ctx;
    this.koaRequest = ctx.request;
    this.nodeRequest = ctx.req;
  }

  accepts(...args) {
    return this.koaRequest.accepts(...args);
  }

  acceptsCharset(...args) {
    return this.koaRequest.acceptsCharsets(...args);
  }
  get acceptsCharsets() {
    return this.acceptsCharset;
  }

  acceptsEncoding(...args) {
    return this.koaRequest.acceptsEncodings(...args);
  }
  get acceptsEncodings() {
    return this.acceptsEncoding;
  }

  acceptsLanguage(...args) {
    return this.koaRequest.acceptsLanguages(...args);
  }
  get acceptsLanguages() {
    return this.acceptsLanguage;
  }

  get(name) {
    if (!name) throw new TypeError('name argument is required to req.get');
    if (typeof name !== 'string') throw new TypeError('name must be a string to req.get');
    // The default value of express is undefined
    return this.koaRequest.get(name) || undefined;
  }
  get header() {
    return this.get;
  }

  get hostname() {
    return this.koaRequest.hostname;
  }
  get host() {
    return this.hostname;
  }

  get ip() {
    return this.koaRequest.ip;
  }
  get ips() {
    return this.koaRequest.ips;
  }

  is(types) {
    return this.koaRequest.is(types);
  }

}

module.exports = ExpressRequest;
