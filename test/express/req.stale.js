
'use strict';

const koa = require('koa'),
  request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.stale', function() {
    it('should return false when the resource is not modified', async () => {
      const app = new koa();
      const etag = '"12345"';

      app.use(wrap(function(req, res) {
        res.set('ETag', etag);
        res.send(req.stale);
      }));

      await request(app.callback())
        .get('/')
        .set('If-None-Match', etag)
        .expect(304);
    });

    it('should return true when the resource is modified', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.set('ETag', '"123"');
        res.send(req.stale);
      }));

      await request(app.callback())
        .get('/')
        .set('If-None-Match', '"12345"')
        .expect(200, 'true');
    });

    it('should return true without response headers', async () => {
      const app = new koa();

      app.disable('x-powered-by');
      app.use(wrap(function(req, res) {
        res.send(req.stale);
      }));

      await request(app.callback())
        .get('/')
        .expect(200, 'true');
    });
  });
});
