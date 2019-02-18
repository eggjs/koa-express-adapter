'use strict';

const after = require('after');
const Buffer = require('safe-buffer').Buffer;
const koa = require('koa'),
  request = require('supertest'),
  assert = require('assert');
const onFinished = require('on-finished');
const path = require('path');
const should = require('should');
const fixtures = path.join(__dirname, 'fixtures');
const { wrap } = require('../..');
const utils = require('../utils');

describe.only('res', function() {
  describe('.sendFile(path)', function() {
    it('should error missing path', async () => {
      const app = createApp();

      await request(app.callback())
        .get('/')
        .expect(500, /path.*required/);
    });

    it('should transfer a file', async () => {
      const app = createApp(path.resolve(fixtures, 'name.txt'));

      await request(app.callback())
        .get('/')
        .expect(200, 'tobi');
    });

    it('should transfer a file with special characters in string', async () => {
      const app = createApp(path.resolve(fixtures, '% of dogs.txt'));

      await request(app.callback())
        .get('/')
        .expect(200, '20%');
    });

    it('should include ETag', async () => {
      const app = createApp(path.resolve(fixtures, 'name.txt'));

      await request(app.callback())
        .get('/')
        .expect('ETag', /^(?:W\/)?"[^"]+"$/)
        .expect(200, 'tobi');
    });

    it('should 304 when ETag matches', async () => {
      const app = createApp(path.resolve(fixtures, 'name.txt'));

      const res = await request(app.callback())
        .get('/')
        .expect('ETag', /^(?:W\/)?"[^"]+"$/)
        .expect(200, 'tobi');

      const etag = res.headers.etag;
      await request(app.callback())
        .get('/')
        .set('If-None-Match', etag)
        .expect(304);
    });

    it('should 404 for directory', async () => {
      const app = createApp(path.resolve(fixtures, 'blog'));

      await request(app.callback())
        .get('/')
        .expect(404);
    });

    it('should 404 when not found', async () => {
      const app = createApp(path.resolve(fixtures, 'does-no-exist'));

      app.use(wrap(function(req, res) {
        res.statusCode = 200;
        res.send('no!');
      }));

      await request(app.callback())
        .get('/')
        .expect(404);
    });

    it('should not override manual content-types', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.contentType('application/x-bogus');
        res.sendFile(path.resolve(fixtures, 'name.txt'));
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'application/x-bogus');
    });

    it('should not error if the client aborts', async () => {
      const app = new koa();
      const cb = after(2);
      let error = null;
      let server;
      let test;

      app.use(wrap(function(req, res) {
        setImmediate(function() {
          res.sendFile(path.resolve(fixtures, 'name.txt'));
          server.close(cb);
          setTimeout(function() {
            cb(error);
          }, 10);
        });
        test.abort();
      }));

      app.use(wrap(function(err, req, res, next) {
        error = err;
        next(err);
      }));

      app.listen();
      test = request(server).get('/');
      test.end();
    });

    describe('with "cacheControl" option', function() {
      it('should enable cacheControl by default', async () => {
        const app = createApp(path.resolve(__dirname, 'fixtures/name.txt'));

        await request(app.callback())
          .get('/')
          .expect('Cache-Control', 'public, max-age=0')
          .expect(200);
      });

      it('should accept cacheControl option', async () => {
        const app = createApp(path.resolve(__dirname, 'fixtures/name.txt'), { cacheControl: false });

        await request(app.callback())
          .get('/')
          .expect(utils.shouldNotHaveHeader('Cache-Control'))
          .expect(200);
      });
    });

    describe('with "dotfiles" option', function() {
      it('should not serve dotfiles by default', async () => {
        const app = createApp(path.resolve(__dirname, 'fixtures/.name'));

        await request(app.callback())
          .get('/')
          .expect(404);
      });

      it('should accept dotfiles option', async () => {
        const app = createApp(path.resolve(__dirname, 'fixtures/.name'), { dotfiles: 'allow' });

        await request(app.callback())
          .get('/')
          .expect(200)
          .expect(shouldHaveBody(Buffer.from('tobi')));
      });
    });

    describe('with "headers" option', function() {
      it('should accept headers option', async () => {
        const headers = {
          'x-success': 'sent',
          'x-other': 'done',
        };
        const app = createApp(path.resolve(__dirname, 'fixtures/name.txt'), { headers });

        await request(app.callback())
          .get('/')
          .expect('x-success', 'sent')
          .expect('x-other', 'done')
          .expect(200);
      });

      it('should ignore headers option on 404', async () => {
        const headers = { 'x-success': 'sent' };
        const app = createApp(path.resolve(__dirname, 'fixtures/does-not-exist'), { headers });

        await request(app.callback())
          .get('/')
          .expect(utils.shouldNotHaveHeader('X-Success'))
          .expect(404);
      });
    });

    describe('with "immutable" option', function() {
      it('should add immutable cache-control directive', async () => {
        const app = createApp(path.resolve(__dirname, 'fixtures/name.txt'), {
          immutable: true,
          maxAge: '4h',
        });

        await request(app.callback())
          .get('/')
          .expect('Cache-Control', 'public, max-age=14400, immutable')
          .expect(200);
      });
    });

    describe('with "maxAge" option', function() {
      it('should set cache-control max-age from number', async () => {
        const app = createApp(path.resolve(__dirname, 'fixtures/name.txt'), {
          maxAge: 14400000,
        });

        await request(app.callback())
          .get('/')
          .expect('Cache-Control', 'public, max-age=14400')
          .expect(200);
      });

      it('should set cache-control max-age from string', async () => {
        const app = createApp(path.resolve(__dirname, 'fixtures/name.txt'), {
          maxAge: '4h',
        });

        await request(app.callback())
          .get('/')
          .expect('Cache-Control', 'public, max-age=14400')
          .expect(200);
      });
    });

    describe('with "root" option', function() {
      it('should not transfer relative with without', async () => {
        const app = createApp('test/fixtures/name.txt');

        await request(app.callback())
          .get('/')
          .expect(500, /must be absolute/);
      });

      it('should serve relative to "root"', async () => {
        const app = createApp('name.txt', { root: fixtures });

        await request(app.callback())
          .get('/')
          .expect(200, 'tobi');
      });

      it('should disallow requesting out of "root"', async () => {
        const app = createApp('foo/../../user.html', { root: fixtures });

        await request(app.callback())
          .get('/')
          .expect(403);
      });
    });
  });

  describe('.sendFile(path, fn)', function() {
    it('should invoke the callback when complete', async () => {
      const cb = after(2);
      const app = createApp(path.resolve(fixtures, 'name.txt'), cb);

      await request(app.callback())
        .get('/')
        .expect(200, cb);
    });

    it('should invoke the callback when client aborts', async () => {
      const cb = after(1);
      const app = new koa();
      let server;
      let test;

      app.use(wrap(function(req, res) {
        setImmediate(function() {
          res.sendFile(path.resolve(fixtures, 'name.txt'), function(err) {
            should(err).be.ok();
            err.code.should.equal('ECONNABORTED');
            server.close(cb);
          });
        });
        test.abort();
      }));

      server = app.listen();
      test = request(server).get('/');
      test.expect(200, cb);
    });

    it('should invoke the callback when client already aborted', async () => {
      const cb = after(1);
      const app = new koa();
      let server;
      let test;

      app.use(wrap(function(req, res) {
        onFinished(res, function() {
          res.sendFile(path.resolve(fixtures, 'name.txt'), function(err) {
            should(err).be.ok();
            err.code.should.equal('ECONNABORTED');
            server.close(cb);
          });
        });
        test.abort();
      }));

      server = app.listen();
      test = request(server).get('/');
      test.expect(200, cb);
    });

    it('should invoke the callback without error when HEAD', async () => {
      const app = new koa();
      const cb = after(2);

      app.use(wrap(function(req, res) {
        res.sendFile(path.resolve(fixtures, 'name.txt'), cb);
      }));

      await request(app.callback())
        .head('/')
        .expect(200, cb);
    });

    it('should invoke the callback without error when 304', async () => {
      const app = new koa();
      const cb = after(3);

      app.use(wrap(function(req, res) {
        res.sendFile(path.resolve(fixtures, 'name.txt'), cb);
      }));

      const res = await request(app.callback())
        .get('/')
        .expect('ETag', /^(?:W\/)?"[^"]+"$/)
        .expect(200, 'tobi');

      const etag = res.headers.etag;
      await request(app.callback())
        .get('/')
        .set('If-None-Match', etag)
        .expect(304);
    });

    it('should invoke the callback on 404', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.sendFile(path.resolve(fixtures, 'does-not-exist'), function(err) {
          should(err).be.ok();
          err.status.should.equal(404);
          res.send('got it');
        });
      }));

      await request(app.callback())
        .get('/')
        .expect(200, 'got it');
    });
  });

  describe('.sendFile(path, options)', function() {
    it('should pass options to send module', async () => {
      request(createApp(path.resolve(fixtures, 'name.txt'), { start: 0, end: 1 }))
        .get('/')
        .expect(200, 'to');
    });
  });

  describe('.sendfile(path, fn)', function() {
    it('should invoke the callback when complete', async () => {
      const app = new koa();
      const cb = after(2);

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/user.html', cb);
      }));

      await request(app.callback())
        .get('/')
        .expect(200, cb);
    });

    it('should utilize the same options as express.static()', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/user.html', { maxAge: 60000 });
      }));

      await request(app.callback())
        .get('/')
        .expect('Cache-Control', 'public, max-age=60');
    });

    it('should invoke the callback when client aborts', async () => {
      const cb = after(1);
      const app = new koa();
      let server;
      let test;

      app.use(wrap(function(req, res) {
        setImmediate(function() {
          res.sendfile('test/fixtures/name.txt', function(err) {
            should(err).be.ok();
            err.code.should.equal('ECONNABORTED');
            server.close(cb);
          });
        });
        test.abort();
      }));

      server = app.listen();
      test = request(server).get('/');
      test.expect(200, cb);
    });

    it('should invoke the callback when client already aborted', async () => {
      const cb = after(1);
      const app = new koa();
      let server;
      let test;

      app.use(wrap(function(req, res) {
        onFinished(res, function() {
          res.sendfile('test/fixtures/name.txt', function(err) {
            should(err).be.ok();
            err.code.should.equal('ECONNABORTED');
            server.close(cb);
          });
        });
        test.abort();
      }));

      server = app.listen();
      test = request(server).get('/');
      test.expect(200, cb);
    });

    it('should invoke the callback without error when HEAD', async () => {
      const app = new koa();
      const cb = after(2);

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/name.txt', cb);
      }));

      await request(app.callback())
        .head('/')
        .expect(200, cb);
    });

    it('should invoke the callback without error when 304', async () => {
      const app = new koa();
      const cb = after(3);

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/name.txt', cb);
      }));

      const res = await request(app.callback())
        .get('/')
        .expect('ETag', /^(?:W\/)?"[^"]+"$/)
        .expect(200, 'tobi');

      const etag = res.headers.etag;
      await request(app.callback())
        .get('/')
        .set('If-None-Match', etag)
        .expect(304);
    });

    it('should invoke the callback on 404', async () => {
      const app = new koa();
      let calls = 0;

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/nope.html', function(err) {
          assert.equal(calls++, 0);
          assert(!res.headersSent);
          res.send(err.message);
        });
      }));

      await request(app.callback())
        .get('/')
        .expect(200, /^ENOENT.*?, stat/);
    });

    it('should not override manual content-types', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.contentType('txt');
        res.sendfile('test/fixtures/user.html');
      }));

      await request(app.callback())
        .get('/')
        .expect('Content-Type', 'text/plain; charset=utf-8');
    });

    it('should invoke the callback on 403', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/foo/../user.html', function(err) {
          assert(!res.headersSent);
          res.send(err.message);
        });
      }));

      await request(app.callback())
        .get('/')
        .expect('Forbidden')
        .expect(200);
    });

    it('should invoke the callback on socket error', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/user.html', function() {
          assert(!res.headersSent);
          req.socket.listeners('error').should.have.length(1); // node's original handler
        });

        req.socket.emit('error', new Error('broken!'));
      }));

      await request(app.callback())
        .get('/')
        .end();
    });
  });

  describe('.sendfile(path)', function() {
    it('should not serve dotfiles', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/.name');
      }));

      await request(app.callback())
        .get('/')
        .expect(404);
    });

    it('should accept dotfiles option', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/.name', { dotfiles: 'allow' });
      }));

      await request(app.callback())
        .get('/')
        .expect(200)
        .expect(shouldHaveBody(Buffer.from('tobi')));
    });

    it('should accept headers option', async () => {
      const app = new koa();
      const headers = {
        'x-success': 'sent',
        'x-other': 'done',
      };

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/user.html', { headers });
      }));

      await request(app.callback())
        .get('/')
        .expect('x-success', 'sent')
        .expect('x-other', 'done')
        .expect(200);
    });

    it('should ignore headers option on 404', async () => {
      const app = new koa();
      const headers = { 'x-success': 'sent' };

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/user.nothing', { headers });
      }));

      await request(app.callback())
        .get('/')
        .expect(utils.shouldNotHaveHeader('X-Success'))
        .expect(404);
    });

    it('should transfer a file', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/name.txt');
      }));

      await request(app.callback())
        .get('/')
        .expect(200, 'tobi');
    });

    it('should transfer a directory index file', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/blog/');
      }));

      await request(app.callback())
        .get('/')
        .expect(200, '<b>index</b>');
    });

    it('should 404 for directory without trailing slash', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/blog');
      }));

      await request(app.callback())
        .get('/')
        .expect(404);
    });

    it('should transfer a file with urlencoded name', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.sendfile('test/fixtures/%25%20of%20dogs.txt');
      }));

      await request(app.callback())
        .get('/')
        .expect(200, '20%');
    });

    it('should not error if the client aborts', async () => {
      const app = new koa();
      const cb = after(2);
      let error = null;
      let server;
      let test;

      app.use(wrap(function(req, res) {
        setImmediate(function() {
          res.sendfile(path.resolve(fixtures, 'name.txt'));
          server.close(cb);
          setTimeout(function() {
            cb(error);
          }, 10);
        });
        test.abort();
      }));

      app.use(wrap(function(err, req, res, next) {
        error = err;
        next(err);
      }));

      server = app.listen();
      test = request(server).get('/');
      test.end();
    });

    describe('with an absolute path', function() {
      it('should transfer the file', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.sendfile(path.join(__dirname, '/fixtures/user.html'));
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'text/html; charset=UTF-8')
          .expect(200, '<p>{{user.name}}</p>');
      });
    });

    describe('with a relative path', function() {
      it('should transfer the file', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.sendfile('test/fixtures/user.html');
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'text/html; charset=UTF-8')
          .expect(200, '<p>{{user.name}}</p>');
      });

      it('should serve relative to "root"', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.sendfile('user.html', { root: 'test/fixtures/' });
        }));

        await request(app.callback())
          .get('/')
          .expect('Content-Type', 'text/html; charset=UTF-8')
          .expect(200, '<p>{{user.name}}</p>');
      });

      it('should consider ../ malicious when "root" is not set', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.sendfile('test/fixtures/foo/../user.html');
        }));

        await request(app.callback())
          .get('/')
          .expect(403);
      });

      it('should allow ../ when "root" is set', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.sendfile('foo/../user.html', { root: 'test/fixtures' });
        }));

        await request(app.callback())
          .get('/')
          .expect(200);
      });

      it('should disallow requesting out of "root"', async () => {
        const app = new koa();

        app.use(wrap(function(req, res) {
          res.sendfile('foo/../../user.html', { root: 'test/fixtures' });
        }));

        await request(app.callback())
          .get('/')
          .expect(403);
      });

      it('should next(404) when not found', async () => {
        const app = new koa();
        let calls = 0;

        app.use(wrap(function(req, res) {
          res.sendfile('user.html');
        }));

        app.use(wrap(function() {
          assert(0, 'this should not be called');
        }));

        app.use(wrap(function(err, req, res, next) {
          ++calls;
          next(err);
        }));

        const res = await request(app.callback())
          .get('/')
          .end();

        res.statusCode.should.equal(404);
        calls.should.equal(1);
      });

      describe('with non-GET', function() {
        it('should still serve', async () => {
          const app = new koa();

          app.use(wrap(function(req, res) {
            res.sendfile(path.join(__dirname, '/fixtures/name.txt'));
          }));

          await request(app.callback())
            .get('/')
            .expect('tobi');
        });
      });
    });
  });
});

describe('.sendfile(path, options)', function() {
  it('should pass options to send module', async () => {
    const app = new koa();

    app.use(wrap(function(req, res) {
      res.sendfile(path.resolve(fixtures, 'name.txt'), { start: 0, end: 1 });
    }));

    await request(app.callback())
      .get('/')
      .expect(200, 'to');
  });
});

function createApp(path, options, fn) {
  const app = new koa();

  app.use(wrap(function(req, res) {
    res.sendFile(path, options, fn);
  }));

  return app;
}

function shouldHaveBody(buf) {
  return function(res) {
    const body = !Buffer.isBuffer(res.body)
      ? Buffer.from(res.text)
      : res.body;
    assert.ok(body, 'response has body');
    assert.strictEqual(body.toString('hex'), buf.toString('hex'));
  };
}
