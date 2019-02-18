'use strict';

const koa = require('koa'),
  request = require('supertest'),
  cookieParser = require('cookie-parser');
const { wrap } = require('../..');

describe('req', function() {
  describe('.signedCookies', function() {
    it('should return a signed JSON cookie', async () => {
      const app = new koa();

      app.use(cookieParser('secret'));

      app.use(wrap(function(req, res) {
        if (req.path === '/set') {
          res.cookie('obj', { foo: 'bar' }, { signed: true });
          res.end();
        } else {
          res.send(req.signedCookies);
        }
      }));

      const res = await request(app.callback())
        .get('/set')
        .end();

      const cookie = res.header['set-cookie'];

      await request(app.callback())
        .get('/')
        .set('Cookie', cookie)
        .expect(200, { obj: { foo: 'bar' } });
    });
  });
});

