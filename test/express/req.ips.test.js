
'use strict';

const koa = require('koa'),
  request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.ips', function() {
    describe('when X-Forwarded-For is present', function() {
      describe('when "trust proxy" is enabled', function() {
        it('should return an array of the specified addresses', async () => {
          const app = new koa();

          app.proxy = true;

          app.use(wrap(function(req, res) {
            res.send(req.ips);
          }));

          await request(app.callback())
            .get('/')
            .set('X-Forwarded-For', 'client, p1, p2')
            .expect('["client","p1","p2"]');
        });

        it.skip('should stop at first untrusted', async () => {
          const app = new koa();

          app.set('trust proxy', 2);

          app.use(wrap(function(req, res) {
            res.send(req.ips);
          }));

          await request(app.callback())
            .get('/')
            .set('X-Forwarded-For', 'client, p1, p2')
            .expect('["p1","p2"]');
        });
      });

      describe('when "trust proxy" is disabled', function() {
        it('should return an empty array', async () => {
          const app = new koa();

          app.use(wrap(function(req, res) {
            res.send(req.ips);
          }));

          await request(app.callback())
            .get('/')
            .set('X-Forwarded-For', 'client, p1, p2')
            .expect('[]');
        });
      });
    });

    describe('when X-Forwarded-For is not present', function() {
      it('should return []', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.send(req.ips);
        }));

        await request(app.callback())
          .get('/')
          .expect('[]');
      });
    });
  });
});
