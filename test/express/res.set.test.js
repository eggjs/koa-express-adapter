'use strict';

const koa = require('koa');
const request = require('supertest');
const wrap = require('../../lib/wrap');

describe('res', function() {
  describe('.set(field, value)', function() {
    it('should set the response header field', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.set('Content-Type', 'text/x-foo; charset=utf-8').end();
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'text/x-foo; charset=utf-8');
    });

    it('should coerce to a string', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.set('X-Number', 123);
        res.end(typeof res.get('X-Number'));
      }));

      await request(app.callback())
        .get('/')
        .expect('X-Number', '123')
        .expect(200, 'string');
    });
  });

  describe('.set(field, values)', function() {
    it('should set multiple response header fields', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.set('Set-Cookie', [ 'type=ninja', 'language=javascript' ]);
        res.send(res.get('Set-Cookie'));
      }));

      await request(app.callback())
        .get('/')
        .expect('["type=ninja","language=javascript"]');
    });

    it('should coerce to an array of strings', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.set('X-Numbers', [ 123, 456 ]);
        res.end(JSON.stringify(res.get('X-Numbers')));
      }));

      await request(app.callback())
        .get('/')
        .expect('X-Numbers', '123, 456')
        .expect(200, '["123","456"]');
    });

    it('should not set a charset of one is already set', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.set('Content-Type', 'text/html; charset=lol');
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'text/html; charset=lol')
        .expect(200);
    });

    it.skip('should throw when Content-Type is an array', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.set('Content-Type', [ 'text/html' ]);
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .expect(res => {
          console.log(res);
        })
        .expect(500, /TypeError: Content-Type cannot be set to an Array/);
    });
  });

  describe('.set(object)', function() {
    it('should set multiple fields', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.set({
          'X-Foo': 'bar',
          'X-Bar': 'baz',
        }).end();
      }));

      await request(app.callback())
        .get('/')
        .expect('X-Foo', 'bar')
        .expect('X-Bar', 'baz')
        .end();
    });

    it('should coerce to a string', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.set({ 'X-Number': 123 });
        res.end(typeof res.get('X-Number'));
      }));

      await request(app.callback())
        .get('/')
        .expect('X-Number', '123')
        .expect(200, 'string');
    });
  });
});
