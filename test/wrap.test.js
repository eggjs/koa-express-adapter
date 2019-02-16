'use strict';

const koa = require('koa');
const request = require('supertest');
const { wrap } = require('..');

describe.skip('test/wrap.test.js', () => {
  let app;

  it('b', async () => {
    app = new koa();
    app.use(wrap(function(req, res, next) {
      setTimeout(() => {
        next();
      }, 1000);
    }));
    app.use(wrap(function(req, res) {
      res.send('a');
    }));

    request(app.callback())
      .get('/')
      .expect({});
  });

});
