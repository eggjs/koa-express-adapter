'use strict';

const assert = require('assert');
const koa = require('koa');
const Buffer = require('safe-buffer').Buffer;
const methods = require('methods');
const request = require('supertest');
const wrap = require('../../lib/wrap');
const utils = require('../utils');

describe('res', function() {
  describe('.send()', function() {
    it('should set body to ""', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.send();
      }));

      await request(app.callback())
        .get('/')
        .expect(200, '');
    });
  });

  describe('.send(null)', function() {
    it('should set body to ""', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.send(null);
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Length', '0')
        .expect(200, '');
    });
  });

  describe('.send(undefined)', function() {
    it('should set body to ""', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.send(undefined);
      }));

      await request(app.callback())
        .get('/')
        .expect(200, '');
    });
  });

  describe('.send(code)', function() {
    it('should set .statusCode', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.send(201);
      }));

      await request(app.callback())
        .get('/')
        .expect('Created')
        .expect(201);
    });
  });

  describe('.send(code, body)', function() {
    it('should set .statusCode and body', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.send(201, 'Created :)');
      }));

      await request(app.callback())
        .get('/')
        .expect('Created :)')
        .expect(201);
    });
  });

  describe('.send(body, code)', function() {
    it('should be supported for backwards compat', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.send('Bad!', 400);
      }));

      await request(app.callback())
        .get('/')
        .expect('Bad!')
        .expect(400);
    });
  });

  describe('.send(code, number)', function() {
    it('should send number as json', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.send(200, 0.123);
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '0.123');
    });
  });

  describe('.send(String)', function() {
    it('should send as html', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.send('<p>hey</p>');
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(200, '<p>hey</p>');
    });

    it('should set ETag', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        const str = Array(1000).join('-');
        res.send(str);
      }));

      await request(app.callback())
        .get('/')
        .expect('ETag', 'W/"3e7-qPnkJ3CVdVhFJQvUBfF10TmVA7g"')
        .expect(200);
    });

    it('should not override Content-Type', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.set('Content-Type', 'text/plain').send('hey');
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'text/plain; charset=utf-8')
        .expect(200, 'hey');
    });

    it('should override charset in Content-Type', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.set('Content-Type', 'text/plain; charset=iso-8859-1').send('hey');
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'text/plain; charset=utf-8')
        .expect(200, 'hey');
    });

    it('should keep charset in Content-Type for Buffers', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.set('Content-Type', 'text/plain; charset=iso-8859-1').send(Buffer.from('hi'));
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'text/plain; charset=iso-8859-1')
        .expect(200, 'hi');
    });
  });

  describe('.send(Buffer)', function() {
    it('should send as octet-stream', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.send(Buffer.from('hello'));
      }));

      await request(app.callback())
        .get('/')
        .expect(200)
        .expect('Content-Type', 'application/octet-stream')
        .expect(shouldHaveBody(Buffer.from('hello')))
        .end(done);
    });

    it('should set ETag', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.send(Buffer.alloc(999, '-'));
      }));

      await request(app.callback())
        .get('/')
        .expect('ETag', 'W/"3e7-qPnkJ3CVdVhFJQvUBfF10TmVA7g"')
        .expect(200);
    });

    it('should not override Content-Type', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.set('Content-Type', 'text/plain').send(Buffer.from('hey'));
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'text/plain; charset=utf-8')
        .expect(200, 'hey');
    });

    it('should not override ETag', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.type('text/plain').set('ETag', '"foo"').send(Buffer.from('hey'));
      }));

      await request(app.callback())
        .get('/')
        .expect('ETag', '"foo"')
        .expect(200, 'hey');
    });
  });

  describe('.send(Object)', function() {
    it('should send as application/json', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.send({ name: 'tobi' });
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '{"name":"tobi"}');
    });
  });

  describe('when the request method is HEAD', function() {
    it('should ignore the body', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.send('yay');
      }));

      await request(app.callback())
        .head('/')
        .expect(200)
        .expect(shouldNotHaveBody())
        .end(done);
    });
  });

  describe('when .statusCode is 204', function() {
    it('should strip Content-* fields, Transfer-Encoding field, and body', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.status(204).set('Transfer-Encoding', 'chunked').send('foo');
      }));

      await request(app.callback())
        .get('/')
        .expect(utils.shouldNotHaveHeader('Content-Type'))
        .expect(utils.shouldNotHaveHeader('Content-Length'))
        .expect(utils.shouldNotHaveHeader('Transfer-Encoding'))
        .expect(204, '');
    });
  });

  describe('when .statusCode is 304', function() {
    it('should strip Content-* fields, Transfer-Encoding field, and body', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.status(304).set('Transfer-Encoding', 'chunked').send('foo');
      }));

      await request(app.callback())
        .get('/')
        .expect(utils.shouldNotHaveHeader('Content-Type'))
        .expect(utils.shouldNotHaveHeader('Content-Length'))
        .expect(utils.shouldNotHaveHeader('Transfer-Encoding'))
        .expect(304, '');
    });
  });

  it('should always check regardless of length', async () => {
    const app = new koa();
    const etag = '"asdf"';

    app.use(wrap(function(req, res, next) {
      res.set('ETag', etag);
      res.send('hey');
    }));

    await request(app.callback())
      .get('/')
      .set('If-None-Match', etag)
      .expect(304);
  });

  it('should respond with 304 Not Modified when fresh', async () => {
    const app = new koa();
    const etag = '"asdf"';

    app.use(wrap(function(req, res) {
      const str = Array(1000).join('-');
      res.set('ETag', etag);
      res.send(str);
    }));

    await request(app.callback())
      .get('/')
      .set('If-None-Match', etag)
      .expect(304);
  });

  it('should not perform freshness check unless 2xx or 304', async () => {
    const app = new koa();
    const etag = '"asdf"';

    app.use(wrap(function(req, res, next) {
      res.status(500);
      res.set('ETag', etag);
      res.send('hey');
    }));

    await request(app.callback())
      .get('/')
      .set('If-None-Match', etag)
      .expect('hey')
      .expect(500);
  });

  it('should not support jsonp callbacks', async () => {
    const app = new koa();

    app.use(wrap(function(req, res) {
      res.send({ foo: 'bar' });
    }));

    await request(app.callback())
      .get('/?callback=foo')
      .expect('{"foo":"bar"}');
  });

  it('should be chainable', async () => {
    const app = new koa();

    app.use(wrap(function(req, res) {
      assert.equal(res.send('hey'), res);
    }));

    await request(app.callback())
      .get('/')
      .expect(200, 'hey');
  });

  describe('"etag" setting', function() {
    describe('when enabled', function() {
      it('should send ETag', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.send('kajdslfkasdf');
        }));

        app.enable('etag');

        await request(app.callback())
          .get('/')
          .expect('ETag', 'W/"c-IgR/L5SF7CJQff4wxKGF/vfPuZ0"')
          .expect(200);
      });

      methods.forEach(function(method) {
        if (method === 'connect') return;

        it('should send ETag in response to ' + method.toUpperCase() + ' request', async () => {
          const app = new koa();

          app[method]('/', wrap(function(req, res) {
            res.send('kajdslfkasdf');
          }));

          await request(app.callback())
            [method]('/')
            .expect('ETag', 'W/"c-IgR/L5SF7CJQff4wxKGF/vfPuZ0"')
            .expect(200);
        });
      });

      it('should send ETag for empty string response', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.send('');
        }));

        app.enable('etag');

        await request(app.callback())
          .get('/')
          .expect('ETag', 'W/"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"')
          .expect(200);
      });

      it('should send ETag for long response', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          const str = Array(1000).join('-');
          res.send(str);
        }));

        app.enable('etag');

        await request(app.callback())
          .get('/')
          .expect('ETag', 'W/"3e7-qPnkJ3CVdVhFJQvUBfF10TmVA7g"')
          .expect(200);
      });

      it('should not override ETag when manually set', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.set('etag', '"asdf"');
          res.send(200);
        }));

        app.enable('etag');

        await request(app.callback())
          .get('/')
          .expect('ETag', '"asdf"')
          .expect(200);
      });

      it('should not send ETag for res.send()', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.send();
        }));

        app.enable('etag');

        await request(app.callback())
          .get('/')
          .expect(utils.shouldNotHaveHeader('ETag'))
          .expect(200);
      });
    });

    describe('when disabled', function() {
      it('should send no ETag', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          const str = Array(1000).join('-');
          res.send(str);
        }));

        app.disable('etag');

        await request(app.callback())
          .get('/')
          .expect(utils.shouldNotHaveHeader('ETag'))
          .expect(200);
      });

      it('should send ETag when manually set', async () => {
        const app = new koa();

        app.disable('etag');

        app.use(wrap(function(req, res) {
          res.set('etag', '"asdf"');
          res.send(200);
        }));

        await request(app.callback())
          .get('/')
          .expect('ETag', '"asdf"')
          .expect(200);
      });
    });

    describe('when "strong"', function() {
      it('should send strong ETag', async () => {
        const app = new koa();

        app.set('etag', 'strong');

        app.use(wrap(function(req, res) {
          res.send('hello, world!');
        }));

        await request(app.callback())
          .get('/')
          .expect('ETag', '"d-HwnTDHB9U/PRbFMN1z1wps51lqk"')
          .expect(200);
      });
    });

    describe('when "weak"', function() {
      it('should send weak ETag', async () => {
        const app = new koa();

        app.set('etag', 'weak');

        app.use(wrap(function(req, res) {
          res.send('hello, world!');
        }));

        await request(app.callback())
          .get('/')
          .expect('ETag', 'W/"d-HwnTDHB9U/PRbFMN1z1wps51lqk"')
          .expect(200);
      });
    });

    describe('when a function', function() {
      it('should send custom ETag', async () => {
        const app = new koa();

        app.set('etag', function(body, encoding) {
          const chunk = !Buffer.isBuffer(body)
            ? Buffer.from(body, encoding)
            : body;
          chunk.toString().should.equal('hello, world!');
          return '"custom"';
        });

        app.use(wrap(function(req, res) {
          res.send('hello, world!');
        }));

        await request(app.callback())
          .get('/')
          .expect('ETag', '"custom"')
          .expect(200);
      });

      it('should not send falsy ETag', async () => {
        const app = new koa();

        app.set('etag', wrap(function(body, encoding) {
          return undefined;
        }));

        app.use(wrap(function(req, res) {
          res.send('hello, world!');
        }));

        await request(app.callback())
          .get('/')
          .expect(utils.shouldNotHaveHeader('ETag'))
          .expect(200);
      });
    });
  });
});

function shouldHaveBody(buf) {
  return function(res) {
    const body = !Buffer.isBuffer(res.body)
      ? Buffer.from(res.text)
      : res.body;
    assert.ok(body, 'response has body');
    assert.strictEqual(body.toString('hex'), buf.toString('hex'));
  };
}

function shouldNotHaveBody() {
  return function(res) {
    assert.ok(res.text === '' || res.text === undefined);
  };
}
