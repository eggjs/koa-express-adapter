'use strict';

class ExpressResponse {
  constructor(ctx) {
    this.ctx = ctx;
    this.koaResponse = ctx.response;
    this.nodeResponse = ctx.res;
  }

  set(...args) {
    this.koaResponse.set(...args);
    return this;
  }
  get header() {
    return this.set;
  }

  get(name) {
    return this.koaResponse.get(name);
  }

  send(body) {
    this.koaResponse.body = body;
    return this;
  }

  json(...args) {
    let body = args[0];
    let status;
    if (args.length === 2) {
      if (typeof args[1] === 'number') {
        // .json(body, status);
        body = args[0];
        status = args[1];
      } else {
        // .json(status, body);
        body = args[1];
        status = args[0];
      }
    }

    if (!this.koaResponse.get('Content-Type')) {
      this.koaResponse.type = 'json';
    }
    if (status) this.koaResponse.status = status;
    this.koaResponse.body = JSON.stringify(body);

    return this;
  }

  end(...args) {
    // prevent koa response again
    this.ctx.respond = false;
    this.nodeResponse.end(...args);
  }

  type(type) {
    this.koaResponse.type = type;
    // default value
    if (!this.koaResponse.type) this.koaResponse.type = 'application/octet-stream';

    return this;
  }

  status(status) {
    this.koaResponse.status = status;

    return this;
  }

  clearCookie(name, options) {
    options = Object.assign({}, { expires: new Date(1), path: '/' }, options);
    this.cookie(name, '', options);
    return this;
  }

  cookie(name, value, options = {}) {
    value = typeof value === 'object'
      ? 'j:' + JSON.stringify(value)
      : String(value);
    value = encodeURIComponent(value);

    // httponly is diabled by default in express
    if (options.httpOnly !== true) options.httpOnly = false;

    this.ctx.cookies.set(name, value, options);

    return this;
  }
}

module.exports = ExpressResponse;
