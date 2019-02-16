
'use strict';

const koa = require('koa'),
  request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.xhr', function() {
    it('should return true when X-Requested-With is xmlhttprequest', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        req.xhr.should.be.true();
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .set('X-Requested-With', 'xmlhttprequest')
        .expect(200);
    });

    it('should case-insensitive', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        req.xhr.should.be.true();
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .set('X-Requested-With', 'XMLHttpRequest')
        .expect(200);
    });

    it('should return false otherwise', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        req.xhr.should.be.false();
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .set('X-Requested-With', 'blahblah')
        .expect(200);
    });

    it('should return false when not present', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        req.xhr.should.be.false();
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .expect(200);
    });
  });
});
