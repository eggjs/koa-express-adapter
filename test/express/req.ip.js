'use strict';

const koa = require('koa'),
  request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.ip', function() {
    describe('when X-Forwarded-For is present', function() {
      describe('when "trust proxy" is enabled', function() {
        it('should return the client addr', async () => {
          const app = new koa();

          app.enable('trust proxy');

          app.use(wrap(function(req, res, next) {
            res.send(req.ip);
          }));

          await request(app.callback())
            .get('/')
            .set('X-Forwarded-For', 'client, p1, p2')
            .expect('client');
        });

        it('should return the addr after trusted proxy', async () => {
          const app = new koa();

          app.set('trust proxy', 2);

          app.use(wrap(function(req, res, next) {
            res.send(req.ip);
          }));

          await request(app.callback())
            .get('/')
            .set('X-Forwarded-For', 'client, p1, p2')
            .expect('p1');
        });

        it('should return the addr after trusted proxy, from sub app', async () => {
          const app = new koa();
          const sub = express();

          app.set('trust proxy', 2);
          app.use(sub);

          sub.use(wrap(function(req, res, next) {
            res.send(req.ip);
          }));

          await request(app.callback())
            .get('/')
            .set('X-Forwarded-For', 'client, p1, p2')
            .expect(200, 'p1');
        });
      });

      describe('when "trust proxy" is disabled', function() {
        it('should return the remote address', async () => {
          const app = new koa();

          app.use(wrap(function(req, res, next) {
            res.send(req.ip);
          }));

          const test = await request(app.callback()).get('/');
          test.set('X-Forwarded-For', 'client, p1, p2');
          test.expect(200, getExpectedClientAddress(test._server));
        });
      });
    });

    describe('when X-Forwarded-For is not present', function() {
      it('should return the remote address', async () => {
        const app = new koa();

        app.enable('trust proxy');

        app.use(wrap(function(req, res, next) {
          res.send(req.ip);
        }));

        const test = await request(app.callback()).get('/');
        test.expect(200, getExpectedClientAddress(test._server));
      });
    });
  });
});

/**
 * Get the local client address depending on AF_NET of server
 */

function getExpectedClientAddress(server) {
  return server.address().address === '::'
    ? '::ffff:127.0.0.1'
    : '127.0.0.1';
}
