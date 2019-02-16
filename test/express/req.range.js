'use strict';

const koa = require('koa');
const request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.range(size)', function() {
    it('should return parsed ranges', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.json(req.range(120));
      }));

      await request(app.callback())
        .get('/')
        .set('Range', 'bytes=0-50,51-100')
        .expect(200, '[{"start":0,"end":50},{"start":51,"end":100}]');
    });

    it('should cap to the given size', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.json(req.range(75));
      }));

      await request(app.callback())
        .get('/')
        .set('Range', 'bytes=0-100')
        .expect(200, '[{"start":0,"end":74}]');
    });

    it('should cap to the given size when open-ended', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.json(req.range(75));
      }));

      await request(app.callback())
        .get('/')
        .set('Range', 'bytes=0-')
        .expect(200, '[{"start":0,"end":74}]');
    });

    it('should have a .type', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.json(req.range(120).type);
      }));

      await request(app.callback())
        .get('/')
        .set('Range', 'bytes=0-100')
        .expect(200, '"bytes"');
    });

    it('should accept any type', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.json(req.range(120).type);
      }));

      await request(app.callback())
        .get('/')
        .set('Range', 'users=0-2')
        .expect(200, '"users"');
    });

    it('should return undefined if no range', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.send(String(req.range(120)));
      }));

      await request(app.callback())
        .get('/')
        .expect(200, 'undefined');
    });
  });

  describe('.range(size, options)', function() {
    describe('with "combine: true" option', function() {
      it('should return combined ranges', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.json(req.range(120, {
            combine: true,
          }));
        }));

        await request(app.callback())
          .get('/')
          .set('Range', 'bytes=0-50,51-100')
          .expect(200, '[{"start":0,"end":100}]');
      });
    });
  });
});
