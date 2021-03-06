'use strict';

const koa = require('koa'),
  request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.secure', function() {
    describe('when X-Forwarded-Proto is missing', function() {
      it('should return false when http', async () => {
        const app = new koa();

        app.get('/', wrap(function(req, res) {
          res.send(req.secure ? 'yes' : 'no');
        }));

        await request(app.callback())
          .get('/')
          .expect('no');
      });
    });
  });

  describe('.secure', function() {
    describe('when X-Forwarded-Proto is present', function() {
      it('should return false when http', async () => {
        const app = new koa();

        app.get('/', wrap(function(req, res) {
          res.send(req.secure ? 'yes' : 'no');
        }));

        await request(app.callback())
          .get('/')
          .set('X-Forwarded-Proto', 'https')
          .expect('no');
      });

      it('should return true when "trust proxy" is enabled', async () => {
        const app = new koa();

        app.enable('trust proxy');

        app.get('/', wrap(function(req, res) {
          res.send(req.secure ? 'yes' : 'no');
        }));

        await request(app.callback())
          .get('/')
          .set('X-Forwarded-Proto', 'https')
          .expect('yes');
      });

      it('should return false when initial proxy is http', async () => {
        const app = new koa();

        app.enable('trust proxy');

        app.get('/', wrap(function(req, res) {
          res.send(req.secure ? 'yes' : 'no');
        }));

        await request(app.callback())
          .get('/')
          .set('X-Forwarded-Proto', 'http, https')
          .expect('no');
      });

      it('should return true when initial proxy is https', async () => {
        const app = new koa();

        app.enable('trust proxy');

        app.get('/', wrap(function(req, res) {
          res.send(req.secure ? 'yes' : 'no');
        }));

        await request(app.callback())
          .get('/')
          .set('X-Forwarded-Proto', 'https, http')
          .expect('yes');
      });

      describe('when "trust proxy" trusting hop count', function() {
        it('should respect X-Forwarded-Proto', async () => {
          const app = new koa();

          app.set('trust proxy', 1);

          app.get('/', wrap(function(req, res) {
            res.send(req.secure ? 'yes' : 'no');
          }));

          await request(app.callback())
            .get('/')
            .set('X-Forwarded-Proto', 'https')
            .expect('yes');
        });
      });
    });
  });
});
