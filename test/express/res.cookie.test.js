'use strict';

const koa = require('koa'),
  request = require('supertest'),
  cookie = require('cookie'),
  cookieParser = require('cookie-parser');
const merge = require('utils-merge');
const { wrap } = require('../..');
const utils = require('../utils');

describe('res', function() {
  describe('.cookie(name, object)', function() {
    it('should generate a JSON cookie', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.cookie('user', { name: 'tobi' }).end();
      }));

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', 'user=j%3A%7B%22name%22%3A%22tobi%22%7D; path=/')
        .expect(200);
    });
  });

  describe('.cookie(name, string)', function() {
    it('should set a cookie', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.cookie('name', 'tobi').end();
      }));

      await request(app.callback())
        .get('/')
        .expect('Set-Cookie', 'name=tobi; path=/')
        .expect(200);
    });

    it('should allow multiple calls', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.cookie('name', 'tobi');
        res.cookie('age', 1);
        res.cookie('gender', '?');
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .end(function(err, res) {
          const val = [ 'name=tobi; path=/', 'age=1; path=/', 'gender=%3F; path=/' ];
          res.headers['set-cookie'].should.eql(val);
        });
    });
  });

  describe('.cookie(name, string, options)', function() {
    it('should set params', async () => {
      const app = new koa();

      app.proxy = true;

      app.use(wrap(function(req, res) {
        res.cookie('name', 'tobi', { httpOnly: true, secure: true });
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .expect('Set-Cookie', 'name=tobi; path=/; secure; httponly')
        .expect(200);
    });

    describe('maxAge', function() {
      it('should set relative expires', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.cookie('name', 'tobi', { maxAge: 1000 });
          res.end();
        }));

        await request(app.callback())
          .get('/')
          .end(function(err, res) {
            res.headers['set-cookie'][0].should.not.containEql('Thu, 01 Jan 1970 00:00:01 GMT');
          });
      });

      it('should set max-age', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.cookie('name', 'tobi', { maxAge: 1000 });
          res.end();
        }));

        await request(app.callback())
          .get('/')
          .expect('Set-Cookie', /expires=/);
      });

      it('should not mutate the options object', async () => {
        const app = new koa();

        const options = { maxAge: 1000 };
        const optionsCopy = merge({}, options);

        app.use(wrap(function(req, res) {
          res.cookie('name', 'tobi', options);
          res.end();
        }));

        await request(app.callback())
          .get('/')
          .end(function(err, res) {
            options.should.eql(optionsCopy);
          });
      });
    });

    describe('signed', function() {
      it('should generate a signed JSON cookie', async () => {
        const app = new koa();

        app.use(cookieParser('foo bar baz'));

        app.use(wrap(function(req, res) {
          res.cookie('user', { name: 'tobi' }, { signed: true }).end();
        }));

        await request(app.callback())
          .get('/')
          .end(function(err, res) {
            let val = res.headers['set-cookie'][0];
            val = cookie.parse(val.split('.')[0]);
            val.user.should.equal('s:j:{"name":"tobi"}');
          });
      });
    });

    describe('signed without secret', function() {
      it('should throw an error', async () => {
        const app = utils.createApp();

        app.use(wrap(cookieParser()));

        app.use(wrap(function(req, res) {
          res.cookie('name', 'tobi', { signed: true }).end();
        }));

        await request(app.callback())
          .get('/')
          .expect(500, /.keys required for signed cookies/);
      });
    });

    describe.skip('.signedCookie(name, string)', function() {
      it('should set a signed cookie', async () => {
        const app = new koa();
        app.keys = [ '123' ];

        app.use(wrap(function(req, res) {
          res.cookie('name', 'tobi').end();
        }));

        await request(app.callback())
          .get('/')
          .expect('Set-Cookie', 'name=s%3Atobi.xJjV2iZ6EI7C8E5kzwbfA9PVLl1ZR07UTnuTgQQ4EnQ; path=/')
          .expect(200);
      });
    });
  });
});
