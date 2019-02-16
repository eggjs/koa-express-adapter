'use strict';

class ExpressResponse {
  constructor(ctx) {
    this.ctx = ctx;
    this.koaResponse = ctx.response;
    this.nodeResponse = ctx.res;
  }

  set(...args) {
    this.koaResponse.set(...args);
  }
  get header() {
    return this.set;
  }

  get(name) {
    return this.koaResponse.get(name);
  }

  send(body) {
    this.koaResponse.body = body;
  }

  json(...args) {
    let body;
    let status;
    if (args.length === 2 && typeof args[1] === 'number') {
      // .json(body, status);
      body = args[0];
      status = args[1];
    } else {
      // .json(status, body);
      body = args[1];
      status = args[0];
    }

    if (!this.koaResponse.get('Content-Type')) {
      this.koaResponse.type = 'json';
    }
    if (status) this.koaResponse.status = status;
    this.koaResponse.body = JSON.stringify(body);
  }

  end(...args) {
    // prevent koa response again
    this.ctx.respond = false;
    this.nodeResponse.end(...args);
  }

  type(type) {
    this.koaResponse.type = type;
  }
}

module.exports = ExpressResponse;
