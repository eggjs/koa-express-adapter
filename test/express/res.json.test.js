'use strict';

const request = require('supertest');
const assert = require('assert');
const { wrap } = require('../..');
const utils = require('../utils');

describe('res', function() {
  describe('.json(object)', function() {
    it('should not support jsonp callbacks', async () => {
      const app = utils.createApp();

      app.use(wrap(function(req, res) {
        res.json({ foo: 'bar' });
      }));

      await request(app.callback())
        .get('/?callback=foo')
        .expect('{"foo":"bar"}');
    });

    it('should not override previous Content-Types', async () => {
      const app = utils.createApp();

      app.router.get('/', wrap(function(req, res) {
        res.type('application/vnd.example+json');
        res.json({ hello: 'world' });
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'application/vnd.example+json')
        .expect(200, '{"hello":"world"}');
    });

    describe('when given primitives', function() {
      it('should respond with json for null', async () => {
        const app = utils.createApp();

        app.use(wrap(function(req, res) {
          res.json(null);
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, 'null');
      });

      it('should respond with json for Number', async () => {
        const app = utils.createApp();

        app.use(wrap(function(req, res) {
          res.json(300);
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '300');
      });

      it('should respond with json for String', async () => {
        const app = utils.createApp();

        app.use(wrap(function(req, res) {
          res.json('str');
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '"str"');
      });
    });

    describe('when given an array', function() {
      it('should respond with json', async () => {
        const app = utils.createApp();

        app.use(wrap(function(req, res) {
          res.json([ 'foo', 'bar', 'baz' ]);
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '["foo","bar","baz"]');
      });
    });

    describe('when given an object', function() {
      it('should respond with json', async () => {
        const app = utils.createApp();

        app.use(wrap(function(req, res) {
          res.json({ name: 'tobi' });
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '{"name":"tobi"}');
      });
    });

    describe.skip('"json escape" setting', function() {
      it('should be undefined by default', function() {
        const app = utils.createApp();
        assert.strictEqual(app.router.get('json escape'), undefined);
      });

      it('should unicode escape HTML-sniffing characters', async () => {
        const app = utils.createApp();

        app.enable('json escape');

        app.use(wrap(function(req, res) {
          res.json({ '&': '<script>' });
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '{"\\u0026":"\\u003cscript\\u003e"}');
      });
    });

    describe.skip('"json replacer" setting', function() {
      it('should be passed to JSON.stringify()', async () => {
        const app = utils.createApp();

        app.set('json replacer', wrap(function(key, val) {
          return key[0] === '_'
            ? undefined
            : val;
        }));

        app.use(wrap(function(req, res) {
          res.json({ name: 'tobi', _id: 12345 });
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '{"name":"tobi"}');
      });
    });

    describe.skip('"json spaces" setting', function() {
      it('should be undefined by default', function() {
        const app = utils.createApp();
        assert(undefined === app.router.get('json spaces'));
      });

      it('should be passed to JSON.stringify()', async () => {
        const app = utils.createApp();

        app.set('json spaces', 2);

        app.use(wrap(function(req, res) {
          res.json({ name: 'tobi', age: 2 });
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '{\n  "name": "tobi",\n  "age": 2\n}');
      });
    });
  });

  describe('.json(status, object)', function() {
    it('should respond with json and set the .statusCode', async () => {
      const app = utils.createApp();

      app.use(wrap(function(req, res) {
        res.json(201, { id: 1 });
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(201, '{"id":1}');
    });
  });

  describe('.json(object, status)', function() {
    it('should respond with json and set the .statusCode for backwards compat', async () => {
      const app = utils.createApp();

      app.use(wrap(function(req, res) {
        res.json({ id: 1 }, 201);
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(201, '{"id":1}');
    });

    it('should use status as second number for backwards compat', async () => {
      const app = utils.createApp();

      app.use(wrap(function(req, res) {
        res.json(200, 201);
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(201, '200');
    });
  });
});
