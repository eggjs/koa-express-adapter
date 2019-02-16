
'use strict';

const koa = require('koa'),
  request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.path', function() {
    it('should return the parsed pathname', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.end(req.path);
      }));

      await request(app.callback())
        .get('/login?redirect=/post/1/comments')
        .expect('/login');
    });
  });
});
