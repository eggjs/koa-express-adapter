
'use strict';

const koa = require('koa');
const request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.accepts(type)', function() {
    it('should return true when Accept is not present', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.end(req.accepts('json') ? 'yes' : 'no');
      }));

      await request(app.callback())
        .get('/')
        .expect('yes');
    });

    it('should return true when present', async () => {
      const app = new koa();

      app.use(wrap(function(req, res, next) {
        res.end(req.accepts('json') ? 'yes' : 'no');
      }));

      await request(app.callback())
        .get('/')
        .set('Accept', 'application/json')
        .expect('yes');
    });

    it('should return false otherwise', async () => {
      const app = new koa();

      app.use(wrap(function(req, res, next) {
        res.end(req.accepts('json') ? 'yes' : 'no');
      }));

      await request(app.callback())
        .get('/')
        .set('Accept', 'text/html')
        .expect('no');
    });
  });

  it('should accept an argument list of type names', async () => {
    const app = new koa();

    app.use(wrap(function(req, res, next) {
      res.end(req.accepts('json', 'html'));
    }));

    await request(app.callback())
      .get('/')
      .set('Accept', 'application/json')
      .expect('json');
  });

  describe('.accepts(types)', function() {
    it('should return the first when Accept is not present', async () => {
      const app = new koa();

      app.use(wrap(function(req, res, next) {
        res.end(req.accepts([ 'json', 'html' ]));
      }));

      await request(app.callback())
        .get('/')
        .expect('json');
    });

    it('should return the first acceptable type', async () => {
      const app = new koa();

      app.use(wrap(function(req, res, next) {
        res.end(req.accepts([ 'json', 'html' ]));
      }));

      await request(app.callback())
        .get('/')
        .set('Accept', 'text/html')
        .expect('html');
    });

    it('should return false when no match is made', async () => {
      const app = new koa();

      app.use(wrap(function(req, res, next) {
        res.end(req.accepts([ 'text/html', 'application/json' ]) ? 'yup' : 'nope');
      }));

      await request(app.callback())
        .get('/')
        .set('Accept', 'foo/bar, bar/baz')
        .expect('nope');
    });

    it('should take quality into account', async () => {
      const app = new koa();

      app.use(wrap(function(req, res, next) {
        res.end(req.accepts([ 'text/html', 'application/json' ]));
      }));

      await request(app.callback())
        .get('/')
        .set('Accept', '*/html; q=.5, application/json')
        .expect('application/json');
    });

    it('should return the first acceptable type with canonical mime types', async () => {
      const app = new koa();

      app.use(wrap(function(req, res, next) {
        res.end(req.accepts([ 'application/json', 'text/html' ]));
      }));

      await request(app.callback())
        .get('/')
        .set('Accept', '*/html')
        .expect('text/html');
    });
  });
});
