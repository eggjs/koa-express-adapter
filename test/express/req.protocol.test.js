
'use strict';

const koa = require('koa'),
  request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.protocol', function() {
    it('should return the protocol string', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.end(req.protocol);
      }));

      await request(app.callback())
        .get('/')
        .expect('http');
    });

    describe('when "trust proxy" is enabled', function() {
      it('should respect X-Forwarded-Proto', async () => {
        const app = new koa();

        app.proxy = true;

        app.use(wrap(function(req, res) {
          res.end(req.protocol);
        }));

        await request(app.callback())
          .get('/')
          .set('X-Forwarded-Proto', 'https')
          .expect('https');
      });

      it('should default to the socket addr if X-Forwarded-Proto not present', async () => {
        const app = new koa();

        app.proxy = true;

        app.use(wrap(function(req, res) {
          req.connection.encrypted = true;
          res.end(req.protocol);
        }));

        await request(app.callback())
          .get('/')
          .expect('https');
      });

      it.skip('should ignore X-Forwarded-Proto if socket addr not trusted', async () => {
        const app = new koa();

        app.set('trust proxy', '10.0.0.1');

        app.use(wrap(function(req, res) {
          res.end(req.protocol);
        }));

        await request(app.callback())
          .get('/')
          .set('X-Forwarded-Proto', 'https')
          .expect('http');
      });

      it('should default to http', async () => {
        const app = new koa();

        app.proxy = true;

        app.use(wrap(function(req, res) {
          res.end(req.protocol);
        }));

        await request(app.callback())
          .get('/')
          .expect('http');
      });

      describe.skip('when trusting hop count', function() {
        it('should respect X-Forwarded-Proto', async () => {
          const app = new koa();

          app.set('trust proxy', 1);

          app.use(wrap(function(req, res) {
            res.end(req.protocol);
          }));

          await request(app.callback())
            .get('/')
            .set('X-Forwarded-Proto', 'https')
            .expect('https');
        });
      });
    });

    describe('when "trust proxy" is disabled', function() {
      it('should ignore X-Forwarded-Proto', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.end(req.protocol);
        }));

        await request(app.callback())
          .get('/')
          .set('X-Forwarded-Proto', 'https')
          .expect('http');
      });
    });
  });
});
