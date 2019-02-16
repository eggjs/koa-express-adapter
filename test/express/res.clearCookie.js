
'use strict';

const koa = require('koa'),
  request = require('supertest');
const wrap = require('../../lib/wrap');

describe('res', function() {
  describe('.clearCookie(name)', function() {
    it('should set a cookie passed expiry', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.clearCookie('sid').end();
      }));

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', 'sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
        .expect(200);
    });
  });

  describe('.clearCookie(name, options)', function() {
    it('should set the given params', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.clearCookie('sid', { path: '/admin' }).end();
      }));

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', 'sid=; Path=/admin; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
        .expect(200);
    });
  });
});
