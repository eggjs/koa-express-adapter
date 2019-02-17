'use strict';

const path = require('path');
const statuses = require('statuses');
const encodeUrl = require('encodeurl');
const contentDisposition = require('content-disposition')
const vary = require('vary');

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

  send(...args) {
    let chunk = args[0];

    // allow status / body
    if (args.length === 2) {
      if (typeof args[0] !== 'number' && typeof args[1] === 'number') {
        // res.send(body, status)
        this.koaResponse.status = args[1];
      } else {
        // res.send(status, body)
        this.koaResponse.status = args[0];
        chunk = args[1];
      }
    }

    // disambiguate res.send(status) and res.send(status, num)
    if (typeof chunk === 'number' && args.length === 1) {
      // res.send(status) will set status message as text string
      if (!this.get('Content-Type')) {
        this.type('txt');
      }

      this.koaResponse.status = chunk;
      chunk = statuses[chunk];
    }

    if (!chunk) {
      this.end('');
    } else {
      this.koaResponse.body = chunk;
    }

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

  sendStatus(status) {
    const body = statuses[status] || String(status);

    this.koaResponse.status = status;
    this.type('txt');
    this.send(body);

    return this;
  }

  location(url) {
    // "back" is an alias for the referrer
    if (url === 'back') {
      url = this.ctx.get('Referrer') || '/';
    }

    // set location
    return this.set('Location', encodeUrl(url));
  }

  redirect(...args) {
    let status = 302;
    let url;
    if (args.length === 2) {
      if (typeof args[0] === 'number') {
        // redirect(status, url);
        status = args[0];
        url = args[1];
      }
    } else {
      url = args[0];
    }

    this.koaResponse.status = status;
    this.ctx.redirect(encodeUrl(url));
  }

  get locals() {
    return this.ctx.locals;
  }
  set locals(locals) {
    this.ctx.locals = locals;
  }

  attachment(filename) {
    if (filename) {
      this.type(path.extname(filename));
    }

    this.set('Content-Disposition', contentDisposition(filename));

    return this;
  }

  vary(field) {
    if (!field || (Array.isArray(field) && !field.length)) {
      return this;
    }

    vary(this, field);

    return this;
  }
}

module.exports = ExpressResponse;
