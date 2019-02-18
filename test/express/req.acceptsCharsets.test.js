
'use strict';

const koa = require('koa'),
  request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.acceptsCharsets(type)', function() {
    describe('when Accept-Charset is not present', function() {
      it('should return true', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.end(req.acceptsCharsets('utf-8') ? 'yes' : 'no');
        }));

        await request(app.callback())
          .get('/')
          .expect('yes');
      });
    });

    describe('when Accept-Charset is not present', function() {
      it('should return true when present', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.end(req.acceptsCharsets('utf-8') ? 'yes' : 'no');
        }));

        await request(app.callback())
          .get('/')
          .set('Accept-Charset', 'foo, bar, utf-8')
          .expect('yes');
      });

      it('should return false otherwise', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.end(req.acceptsCharsets('utf-8') ? 'yes' : 'no');
        }));

        await request(app.callback())
          .get('/')
          .set('Accept-Charset', 'foo, bar')
          .expect('no');
      });
    });
  });
});
