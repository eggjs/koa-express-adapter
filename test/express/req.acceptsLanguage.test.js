
'use strict';

const koa = require('koa'),
  request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.acceptsLanguage', function() {
    it('should be true if language accepted', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        req.acceptsLanguage('en-us').should.be.ok();
        req.acceptsLanguage('en').should.be.ok();
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .set('Accept-Language', 'en;q=.5, en-us')
        .expect(200);
    });

    it('should be false if language not accepted', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        req.acceptsLanguage('es').should.not.be.ok();
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .set('Accept-Language', 'en;q=.5, en-us')
        .expect(200);
    });

    describe('when Accept-Language is not present', function() {
      it('should always return true', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          req.acceptsLanguage('en').should.be.ok();
          req.acceptsLanguage('es').should.be.ok();
          req.acceptsLanguage('jp').should.be.ok();
          res.end();
        }));

        await request(app.callback())
          .get('/')
          .expect(200);
      });
    });
  });
});
