'use strict';

const koa = require('koa'),
  request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.route', function() {
    it('should be the executed Route', async () => {
      const app = new koa();

      app.get('/user/:id/:op?', wrap(function(req, res, next) {
        req.route.path.should.equal('/user/:id/:op?');
        next();
      }));

      app.get('/user/:id/edit', wrap(function(req, res) {
        req.route.path.should.equal('/user/:id/edit');
        res.end();
      }));

      await request(app.callback())
        .get('/user/12/edit')
        .expect(200);
    });
  });
});
