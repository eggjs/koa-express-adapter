'use strict';

const koa = require('koa'),
  request = require('supertest'),
  assert = require('assert');
const utils = require('../utils');
const { wrap } = require('../..');

describe('res', function() {
  describe('.jsonp(object)', function() {
    it('should respond with jsonp', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.jsonp({ count: 1 });
      }));

      await request(app.callback())
        .get('/?callback=something')
        .expect('Content-Type', 'text/javascript; charset=utf-8')
        .expect(200, /something\(\{"count":1\}\);/);
    });

    it('should use first callback parameter with jsonp', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.jsonp({ count: 1 });
      }));

      await request(app.callback())
        .get('/?callback=something&callback=somethingelse')
        .expect('Content-Type', 'text/javascript; charset=utf-8')
        .expect(200, /something\(\{"count":1\}\);/);
    });

    it('should ignore object callback parameter with jsonp', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.jsonp({ count: 1 });
      }));

      await request(app.callback())
        .get('/?callback[a]=something')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '{"count":1}');
    });

    it('should allow renaming callback', async () => {
      const app = new koa();

      app.set('jsonp callback name', 'clb');

      app.use(wrap(function(req, res) {
        res.jsonp({ count: 1 });
      }));

      await request(app.callback())
        .get('/?clb=something')
        .expect('Content-Type', 'text/javascript; charset=utf-8')
        .expect(200, /something\(\{"count":1\}\);/);
    });

    it('should allow []', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.jsonp({ count: 1 });
      }));

      await request(app.callback())
        .get('/?callback=callbacks[123]')
        .expect('Content-Type', 'text/javascript; charset=utf-8')
        .expect(200, /callbacks\[123\]\(\{"count":1\}\);/);
    });

    it('should disallow arbitrary js', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.jsonp({});
      }));

      await request(app.callback())
        .get('/?callback=foo;bar()')
        .expect('Content-Type', 'text/javascript; charset=utf-8')
        .expect(200, /foobar\(\{\}\);/);
    });

    it('should escape utf whitespace', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.jsonp({ str: '\u2028 \u2029 woot' });
      }));

      await request(app.callback())
        .get('/?callback=foo')
        .expect('Content-Type', 'text/javascript; charset=utf-8')
        .expect(200, /foo\(\{"str":"\\u2028 \\u2029 woot"\}\);/);
    });

    it('should not escape utf whitespace for json fallback', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.jsonp({ str: '\u2028 \u2029 woot' });
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '{"str":"\u2028 \u2029 woot"}');
    });

    it('should include security header and prologue', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.jsonp({ count: 1 });
      }));

      await request(app.callback())
        .get('/?callback=something')
        .expect('Content-Type', 'text/javascript; charset=utf-8')
        .expect('X-Content-Type-Options', 'nosniff')
        .expect(200, /^\/\*\*\//);
    });

    it('should not override previous Content-Types with no callback', async () => {
      const app = new koa();

      app.get('/', wrap(function(req, res) {
        res.type('application/vnd.example+json');
        res.jsonp({ hello: 'world' });
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'application/vnd.example+json; charset=utf-8')
        .expect(utils.shouldNotHaveHeader('X-Content-Type-Options'))
        .expect(200, '{"hello":"world"}');
    });

    it('should override previous Content-Types with callback', async () => {
      const app = new koa();

      app.get('/', wrap(function(req, res) {
        res.type('application/vnd.example+json');
        res.jsonp({ hello: 'world' });
      }));

      await request(app.callback())
        .get('/?callback=cb')
        .expect('Content-Type', 'text/javascript; charset=utf-8')
        .expect('X-Content-Type-Options', 'nosniff')
        .expect(200, /cb\(\{"hello":"world"\}\);$/);
    });

    describe('when given primitives', function() {
      it('should respond with json', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.jsonp(null);
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, 'null');
      });
    });

    describe('when given an array', function() {
      it('should respond with json', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.jsonp([ 'foo', 'bar', 'baz' ]);
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '["foo","bar","baz"]');
      });
    });

    describe('when given an object', function() {
      it('should respond with json', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.jsonp({ name: 'tobi' });
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '{"name":"tobi"}');
      });
    });

    describe('when given primitives', function() {
      it('should respond with json for null', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.jsonp(null);
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, 'null');
      });

      it('should respond with json for Number', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.jsonp(300);
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '300');
      });

      it('should respond with json for String', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.jsonp('str');
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '"str"');
      });
    });

    describe('"json escape" setting', function() {
      it('should be undefined by default', function() {
        const app = new koa();
        assert.strictEqual(app.get('json escape'), undefined);
      });

      it('should unicode escape HTML-sniffing characters', async () => {
        const app = new koa();

        app.enable('json escape');

        app.use(wrap(function(req, res) {
          res.jsonp({ '&': '\u2028<script>\u2029' });
        }));

        await request(app.callback())
          .get('/?callback=foo')
          .expect('Content-Type', 'text/javascript; charset=utf-8')
          .expect(200, /foo\({"\\u0026":"\\u2028\\u003cscript\\u003e\\u2029"}\)/);
      });
    });

    describe('"json replacer" setting', function() {
      it('should be passed to JSON.stringify()', async () => {
        const app = new koa();

        app.set('json replacer', function(key, val) {
          return key[0] === '_'
            ? undefined
            : val;
        });

        app.use(wrap(function(req, res) {
          res.jsonp({ name: 'tobi', _id: 12345 });
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '{"name":"tobi"}');
      });
    });

    describe('"json spaces" setting', function() {
      it('should be undefined by default', function() {
        const app = new koa();
        assert(undefined === app.get('json spaces'));
      });

      it('should be passed to JSON.stringify()', async () => {
        const app = new koa();

        app.set('json spaces', 2);

        app.use(wrap(function(req, res) {
          res.jsonp({ name: 'tobi', age: 2 });
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '{\n  "name": "tobi",\n  "age": 2\n}');
      });
    });
  });

  describe('.jsonp(status, object)', function() {
    it('should respond with json and set the .statusCode', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.jsonp(201, { id: 1 });
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(201, '{"id":1}');
    });
  });

  describe('.jsonp(object, status)', function() {
    it('should respond with json and set the .statusCode for backwards compat', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.jsonp({ id: 1 }, 201);
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(201, '{"id":1}');
    });

    it('should use status as second number for backwards compat', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.jsonp(200, 201);
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(201, '200');
    });
  });

  it('should not override previous Content-Types', async () => {
    const app = new koa();

    app.get('/', wrap(function(req, res) {
      res.type('application/vnd.example+json');
      res.jsonp({ hello: 'world' });
    }));

    await request(app.callback())
      .get('/')
      .expect('content-type', 'application/vnd.example+json; charset=utf-8')
      .expect(200, '{"hello":"world"}');
  });
});
