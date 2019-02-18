
'use strict';

const koa = require('koa'),
  request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.hostname', function() {
    it('should return the Host when present', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.end(req.hostname);
      }));

      await request(app.callback())
        .post('/')
        .set('Host', 'example.com')
        .expect('example.com');
    });

    it('should strip port number', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.end(req.hostname);
      }));

      await request(app.callback())
        .post('/')
        .set('Host', 'example.com:3000')
        .expect('example.com');
    });

    it('should return undefined otherwise', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        req.headers.host = null;
        res.end(String(req.hostname));
      }));

      await request(app.callback())
        .post('/')
        .expect('undefined');
    });

    it('should work with IPv6 Host', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.end(req.hostname);
      }));

      await request(app.callback())
        .post('/')
        .set('Host', '[::1]')
        .expect('[::1]');
    });

    it('should work with IPv6 Host and port', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.end(req.hostname);
      }));

      await request(app.callback())
        .post('/')
        .set('Host', '[::1]:3000')
        .expect('[::1]');
    });

    describe('when "trust proxy" is enabled', function() {
      it('should respect X-Forwarded-Host', async () => {
        const app = new koa();

        app.proxy = true;

        app.use(wrap(function(req, res) {
          res.end(req.hostname);
        }));

        await request(app.callback())
          .get('/')
          .set('Host', 'localhost')
          .set('X-Forwarded-Host', 'example.com:3000')
          .expect('example.com');
      });

      it.skip('should ignore X-Forwarded-Host if socket addr not trusted', async () => {
        const app = new koa();

        app.set('trust proxy', '10.0.0.1');

        app.use(wrap(function(req, res) {
          res.end(req.hostname);
        }));

        await request(app.callback())
          .get('/')
          .set('Host', 'localhost')
          .set('X-Forwarded-Host', 'example.com')
          .expect('localhost');
      });

      it('should default to Host', async () => {
        const app = new koa();

        app.proxy = true;

        app.use(wrap(function(req, res) {
          res.end(req.hostname);
        }));

        await request(app.callback())
          .get('/')
          .set('Host', 'example.com')
          .expect('example.com');
      });
    });

    describe('when "trust proxy" is disabled', function() {
      it('should ignore X-Forwarded-Host', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.end(req.hostname);
        }));

        await request(app.callback())
          .get('/')
          .set('Host', 'localhost')
          .set('X-Forwarded-Host', 'evil')
          .expect('localhost');
      });
    });
  });
});
