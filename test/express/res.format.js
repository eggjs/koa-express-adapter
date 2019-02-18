'use strict';

const after = require('after');
const koa = require('koa'),
  request = require('supertest'),
  assert = require('assert');
const express = require('express');
const { wrap } = require('../..');

const app1 = express();

app1.use(function(req, res, next) {
  res.format({
    'text/plain': function() {
      res.send('hey');
    },

    'text/html': function() {
      res.send('<p>hey</p>');
    },

    'application/json': function(a, b, c) {
      assert(req === a);
      assert(res === b);
      assert(next === c);
      res.send({ message: 'hey' });
    },
  });
});

app1.use(function(err, req, res) {
  if (!err.types) throw err;
  res.send(err.status, 'Supports: ' + err.types.join(', '));
});

const app2 = new koa();

app2.use(wrap(function(req, res) {
  res.format({
    text() { res.send('hey'); },
    html() { res.send('<p>hey</p>'); },
    json() { res.send({ message: 'hey' }); },
  });
}));

app2.use(function(err, req, res) {
  res.send(err.status, 'Supports: ' + err.types.join(', '));
});

const app3 = express();

app3.use(function(req, res) {
  res.format({
    text() { res.send('hey'); },
    default() { res.send('default'); },
  });
});

const app4 = express();

app4.get('/', function(req, res) {
  res.format({
    text() { res.send('hey'); },
    html() { res.send('<p>hey</p>'); },
    json() { res.send({ message: 'hey' }); },
  });
});

app4.use(function(err, req, res) {
  res.send(err.status, 'Supports: ' + err.types.join(', '));
});

const app5 = express();

app5.use(function(req, res) {
  res.format({
    default() { res.send('hey'); },
  });
});

describe('res', function() {
  describe('.format(obj)', function() {
    describe('with canonicalized mime types', function() {
      test(app1);
    });

    describe('with extnames', function() {
      test(app2);
    });

    describe('with parameters', function() {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.format({
          'text/plain; charset=utf-8': function() { res.send('hey'); },
          'text/html; foo=bar; bar=baz': function() { res.send('<p>hey</p>'); },
          'application/json; q=0.5': function() { res.send({ message: 'hey' }); },
        });
      }));

      app.use(wrap(function(err, req, res) {
        res.send(err.status, 'Supports: ' + err.types.join(', '));
      }));

      test(app);
    });

    describe('given .default', function() {
      it('should be invoked instead of auto-responding', async () => {
        request(app3)
          .get('/')
          .set('Accept', 'text/html')
          .expect('default');
      });

      it('should work when only .default is provided', async () => {
        request(app5)
          .get('/')
          .set('Accept', '*/*')
          .expect('hey');
      });
    });

    describe('in router', function() {
      test(app4);
    });

    describe('in router', function() {
      const app = new koa();
      const router = express.Router();

      router.get('/', function(req, res) {
        res.format({
          text() { res.send('hey'); },
          html() { res.send('<p>hey</p>'); },
          json() { res.send({ message: 'hey' }); },
        });
      });

      router.use(function(err, req, res) {
        res.send(err.status, 'Supports: ' + err.types.join(', '));
      });

      app.use(router);

      test(app);
    });
  });
});

function test(app) {
  it('should utilize qvalues in negotiation', async () => {
    await request(app.callback())
      .get('/')
      .set('Accept', 'text/html; q=.5, application/json, */*; q=.1')
      .expect({ message: 'hey' });
  });

  it('should allow wildcard type/subtypes', async () => {
    await request(app.callback())
      .get('/')
      .set('Accept', 'text/html; q=.5, application/*, */*; q=.1')
      .expect({ message: 'hey' });
  });

  it('should default the Content-Type', async () => {
    await request(app.callback())
      .get('/')
      .set('Accept', 'text/html; q=.5, text/plain')
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .expect('hey');
  });

  it('should set the correct charset for the Content-Type', async () => {
    const cb = after(3);

    await request(app.callback())
      .get('/')
      .set('Accept', 'text/html')
      .expect('Content-Type', 'text/html; charset=utf-8', cb);

    await request(app.callback())
      .get('/')
      .set('Accept', 'text/plain')
      .expect('Content-Type', 'text/plain; charset=utf-8', cb);

    await request(app.callback())
      .get('/')
      .set('Accept', 'application/json')
      .expect('Content-Type', 'application/json; charset=utf-8', cb);
  });

  it('should Vary: Accept', async () => {
    await request(app.callback())
      .get('/')
      .set('Accept', 'text/html; q=.5, text/plain')
      .expect('Vary', 'Accept');
  });

  describe('when Accept is not present', function() {
    it('should invoke the first callback', async () => {
      await request(app.callback())
        .get('/')
        .expect('hey');
    });
  });

  describe('when no match is made', function() {
    it('should should respond with 406 not acceptable', async () => {
      await request(app.callback())
        .get('/')
        .set('Accept', 'foo/bar')
        .expect('Supports: text/plain, text/html, application/json')
        .expect(406);
    });
  });
}
