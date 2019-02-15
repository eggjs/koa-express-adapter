
var after = require('after');
var Buffer = require('safe-buffer').Buffer
var koa = require('koa')
  , request = require('supertest')
  , assert = require('assert');
var onFinished = require('on-finished');
var path = require('path');
var should = require('should');
var fixtures = path.join(__dirname, 'fixtures');
var utils = require('./support/utils');

describe('res', function(){
  describe('.sendFile(path)', function () {
    it('should error missing path', async () =>{
      var app = createApp();

      await request(app.callback())
      .get('/')
      .expect(500, /path.*required/);
    }));

    it('should transfer a file', async () =>{
      var app = createApp(path.resolve(fixtures, 'name.txt'));

      await request(app.callback())
      .get('/')
      .expect(200, 'tobi');
    }));

    it('should transfer a file with special characters in string', async () =>{
      var app = createApp(path.resolve(fixtures, '% of dogs.txt'));

      await request(app.callback())
      .get('/')
      .expect(200, '20%');
    }));

    it('should include ETag', async () =>{
      var app = createApp(path.resolve(fixtures, 'name.txt'));

      await request(app.callback())
      .get('/')
      .expect('ETag', /^(?:W\/)?"[^"]+"$/)
      .expect(200, 'tobi');
    }));

    it('should 304 when ETag matches', async () =>{
      var app = createApp(path.resolve(fixtures, 'name.txt'));

      await request(app.callback())
      .get('/')
      .expect('ETag', /^(?:W\/)?"[^"]+"$/)
      .expect(200, 'tobi', function (err, res) {
        if (err) return done(err);
        var etag = res.headers.etag;
        await request(app.callback())
        .get('/')
        .set('If-None-Match', etag)
        .expect(304);
      }));
    }));

    it('should 404 for directory', async () =>{
      var app = createApp(path.resolve(fixtures, 'blog'));

      await request(app.callback())
      .get('/')
      .expect(404);
    }));

    it('should 404 when not found', async () =>{
      var app = createApp(path.resolve(fixtures, 'does-no-exist'));

      app.use(wrap(function (req, res) {
        res.statusCode = 200;
        res.send('no!');
      }));

      await request(app.callback())
      .get('/')
      .expect(404);
    }));

    it('should not override manual content-types', async () =>{
      var app = new koa();

      app.use(wrap(function (req, res) {
        res.contentType('application/x-bogus');
        res.sendFile(path.resolve(fixtures, 'name.txt'));
      }));

      await request(app.callback())
      .get('/')
      .expect('Content-Type', 'application/x-bogus')
      .end(done);
    })

    it('should not error if the client aborts', async () =>{
      var app = new koa();
      var cb = after(2)
      var error = null

      app.use(wrap(function (req, res) {
        setImmediate(function () {
          res.sendFile(path.resolve(fixtures, 'name.txt'));
          server.close(cb)
          setTimeout(function () {
            cb(error)
          }, 10)
        })
        test.abort();
      }));

      app.use(wrap(function (err, req, res, next) {
        error = err
        next(err)
      }));

      var server = app.listen()
      var test = request(server).get('/')
      test.end()
    })

    describe('with "cacheControl" option', function () {
      it('should enable cacheControl by default', async () =>{
        var app = createApp(path.resolve(__dirname, 'fixtures/name.txt'))

        await request(app.callback())
        .get('/')
        .expect('Cache-Control', 'public, max-age=0')
        .expect(200)
      })

      it('should accept cacheControl option', async () =>{
        var app = createApp(path.resolve(__dirname, 'fixtures/name.txt'), { cacheControl: false })

        await request(app.callback())
        .get('/')
        .expect(utils.shouldNotHaveHeader('Cache-Control'))
        .expect(200)
      })
    })

    describe('with "dotfiles" option', function () {
      it('should not serve dotfiles by default', async () =>{
        var app = createApp(path.resolve(__dirname, 'fixtures/.name'));

        await request(app.callback())
        .get('/')
        .expect(404);
      }));

      it('should accept dotfiles option', async () =>{
        var app = createApp(path.resolve(__dirname, 'fixtures/.name'), { dotfiles: 'allow' }));

        await request(app.callback())
        .get('/')
        .expect(200)
        .expect(shouldHaveBody(Buffer.from('tobi')))
        .end(done)
      }));
    }));

    describe('with "headers" option', function () {
      it('should accept headers option', async () =>{
        var headers = {
          'x-success': 'sent',
          'x-other': 'done'
        };
        var app = createApp(path.resolve(__dirname, 'fixtures/name.txt'), { headers: headers }));

        await request(app.callback())
        .get('/')
        .expect('x-success', 'sent')
        .expect('x-other', 'done')
        .expect(200);
      }));

      it('should ignore headers option on 404', async () =>{
        var headers = { 'x-success': 'sent' };
        var app = createApp(path.resolve(__dirname, 'fixtures/does-not-exist'), { headers: headers }));

        await request(app.callback())
        .get('/')
        .expect(utils.shouldNotHaveHeader('X-Success'))
        .expect(404);
      }));
    }));

    describe('with "immutable" option', function () {
      it('should add immutable cache-control directive', async () =>{
        var app = createApp(path.resolve(__dirname, 'fixtures/name.txt'), {
          immutable: true,
          maxAge: '4h'
        })

        await request(app.callback())
        .get('/')
        .expect('Cache-Control', 'public, max-age=14400, immutable')
        .expect(200)
      })
    })

    describe('with "maxAge" option', function () {
      it('should set cache-control max-age from number', async () =>{
        var app = createApp(path.resolve(__dirname, 'fixtures/name.txt'), {
          maxAge: 14400000
        })

        await request(app.callback())
        .get('/')
        .expect('Cache-Control', 'public, max-age=14400')
        .expect(200)
      })

      it('should set cache-control max-age from string', async () =>{
        var app = createApp(path.resolve(__dirname, 'fixtures/name.txt'), {
          maxAge: '4h'
        })

        await request(app.callback())
        .get('/')
        .expect('Cache-Control', 'public, max-age=14400')
        .expect(200)
      })
    })

    describe('with "root" option', function () {
      it('should not transfer relative with without', async () =>{
        var app = createApp('test/fixtures/name.txt');

        await request(app.callback())
        .get('/')
        .expect(500, /must be absolute/);
      })

      it('should serve relative to "root"', async () =>{
        var app = createApp('name.txt', {root: fixtures}));

        await request(app.callback())
        .get('/')
        .expect(200, 'tobi');
      })

      it('should disallow requesting out of "root"', async () =>{
        var app = createApp('foo/../../user.html', {root: fixtures}));

        await request(app.callback())
        .get('/')
        .expect(403);
      })
    })
  })

  describe('.sendFile(path, fn)', function () {
    it('should invoke the callback when complete', async () =>{
      var cb = after(2);
      var app = createApp(path.resolve(fixtures, 'name.txt'), cb);

      await request(app.callback())
      .get('/')
      .expect(200, cb);
    })

    it('should invoke the callback when client aborts', async () =>{
      var cb = after(1);
      var app = new koa();

      app.use(wrap(function (req, res) {
        setImmediate(function () {
          res.sendFile(path.resolve(fixtures, 'name.txt'), function (err) {
            should(err).be.ok()
            err.code.should.equal('ECONNABORTED');
            server.close(cb)
          }));
        }));
        test.abort();
      }));

      var server = app.listen()
      var test = request(server).get('/')
      test.expect(200, cb);
    })

    it('should invoke the callback when client already aborted', async () =>{
      var cb = after(1);
      var app = new koa();

      app.use(wrap(function (req, res) {
        onFinished(res, function () {
          res.sendFile(path.resolve(fixtures, 'name.txt'), function (err) {
            should(err).be.ok()
            err.code.should.equal('ECONNABORTED');
            server.close(cb)
          }));
        }));
        test.abort();
      }));

      var server = app.listen()
      var test = request(server).get('/')
      test.expect(200, cb);
    })

    it('should invoke the callback without error when HEAD', async () =>{
      var app = new koa();
      var cb = after(2);

      app.use(wrap(function (req, res) {
        res.sendFile(path.resolve(fixtures, 'name.txt'), cb);
      }));

      await request(app.callback())
      .head('/')
      .expect(200, cb);
    }));

    it('should invoke the callback without error when 304', async () =>{
      var app = new koa();
      var cb = after(3);

      app.use(wrap(function (req, res) {
        res.sendFile(path.resolve(fixtures, 'name.txt'), cb);
      }));

      await request(app.callback())
      .get('/')
      .expect('ETag', /^(?:W\/)?"[^"]+"$/)
      .expect(200, 'tobi', function (err, res) {
        if (err) return cb(err);
        var etag = res.headers.etag;
        await request(app.callback())
        .get('/')
        .set('If-None-Match', etag)
        .expect(304, cb);
      }));
    }));

    it('should invoke the callback on 404', async () =>{
      var app = new koa();

      app.use(wrap(function (req, res) {
        res.sendFile(path.resolve(fixtures, 'does-not-exist'), function (err) {
          should(err).be.ok()
          err.status.should.equal(404);
          res.send('got it');
        }));
      }));

      await request(app.callback())
      .get('/')
      .expect(200, 'got it');
    })
  })

  describe('.sendFile(path, options)', function () {
    it('should pass options to send module', async () =>{
      request(createApp(path.resolve(fixtures, 'name.txt'), { start: 0, end: 1 }))
      .get('/')
      .expect(200, 'to')
    })
  })

  describe('.sendfile(path, fn)', function(){
    it('should invoke the callback when complete', async () =>{
      var app = new koa();
      var cb = after(2);

      app.use(wrap(function(req, res){
        res.sendfile('test/fixtures/user.html', cb)
      }));

      await request(app.callback())
      .get('/')
      .expect(200, cb);
    })

    it('should utilize the same options as express.static()', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.sendfile('test/fixtures/user.html', { maxAge: 60000 }));
      }));

      await request(app.callback())
      .get('/')
      .expect('Cache-Control', 'public, max-age=60')
      .end(done);
    })

    it('should invoke the callback when client aborts', async () =>{
      var cb = after(1);
      var app = new koa();

      app.use(wrap(function (req, res) {
        setImmediate(function () {
          res.sendfile('test/fixtures/name.txt', function (err) {
            should(err).be.ok()
            err.code.should.equal('ECONNABORTED');
            server.close(cb)
          }));
        }));
        test.abort();
      }));

      var server = app.listen()
      var test = request(server).get('/')
      test.expect(200, cb);
    })

    it('should invoke the callback when client already aborted', async () =>{
      var cb = after(1);
      var app = new koa();

      app.use(wrap(function (req, res) {
        onFinished(res, function () {
          res.sendfile('test/fixtures/name.txt', function (err) {
            should(err).be.ok()
            err.code.should.equal('ECONNABORTED');
            server.close(cb)
          }));
        }));
        test.abort();
      }));

      var server = app.listen()
      var test = request(server).get('/')
      test.expect(200, cb);
    })

    it('should invoke the callback without error when HEAD', async () =>{
      var app = new koa();
      var cb = after(2);

      app.use(wrap(function (req, res) {
        res.sendfile('test/fixtures/name.txt', cb);
      }));

      await request(app.callback())
      .head('/')
      .expect(200, cb);
    }));

    it('should invoke the callback without error when 304', async () =>{
      var app = new koa();
      var cb = after(3);

      app.use(wrap(function (req, res) {
        res.sendfile('test/fixtures/name.txt', cb);
      }));

      await request(app.callback())
      .get('/')
      .expect('ETag', /^(?:W\/)?"[^"]+"$/)
      .expect(200, 'tobi', function (err, res) {
        if (err) return cb(err);
        var etag = res.headers.etag;
        await request(app.callback())
        .get('/')
        .set('If-None-Match', etag)
        .expect(304, cb);
      }));
    }));

    it('should invoke the callback on 404', async () =>{
      var app = new koa();
      var calls = 0;

      app.use(wrap(function(req, res){
        res.sendfile('test/fixtures/nope.html', function(err){
          assert.equal(calls++, 0);
          assert(!res.headersSent);
          res.send(err.message);
        }));
      }));

      await request(app.callback())
      .get('/')
      .expect(200, /^ENOENT.*?, stat/);
    })

    it('should not override manual content-types', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.contentType('txt');
        res.sendfile('test/fixtures/user.html');
      }));

      await request(app.callback())
      .get('/')
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .end(done);
    })

    it('should invoke the callback on 403', async () =>{
      var app = new koa()

      app.use(wrap(function(req, res){
        res.sendfile('test/fixtures/foo/../user.html', function(err){
          assert(!res.headersSent);
          res.send(err.message);
        }));
      }));

      await request(app.callback())
      .get('/')
      .expect('Forbidden')
      .expect(200);
    })

    it('should invoke the callback on socket error', async () =>{
      var app = new koa()

      app.use(wrap(function(req, res){
        res.sendfile('test/fixtures/user.html', function(err){
          assert(!res.headersSent);
          req.socket.listeners('error').should.have.length(1); // node's original handler
          done();
        }));

        req.socket.emit('error', new Error('broken!'));
      }));

      await request(app.callback())
      .get('/')
      .end(function(){}));
    })
  })

  describe('.sendfile(path)', function(){
    it('should not serve dotfiles', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.sendfile('test/fixtures/.name');
      }));

      await request(app.callback())
      .get('/')
      .expect(404);
    })

    it('should accept dotfiles option', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.sendfile('test/fixtures/.name', { dotfiles: 'allow' }));
      }));

      await request(app.callback())
      .get('/')
      .expect(200)
      .expect(shouldHaveBody(Buffer.from('tobi')))
      .end(done)
    })

    it('should accept headers option', async () =>{
      var app = new koa();
      var headers = {
        'x-success': 'sent',
        'x-other': 'done'
      };

      app.use(wrap(function(req, res){
        res.sendfile('test/fixtures/user.html', { headers: headers }));
      }));

      await request(app.callback())
      .get('/')
      .expect('x-success', 'sent')
      .expect('x-other', 'done')
      .expect(200);
    })

    it('should ignore headers option on 404', async () =>{
      var app = new koa();
      var headers = { 'x-success': 'sent' };

      app.use(wrap(function(req, res){
        res.sendfile('test/fixtures/user.nothing', { headers: headers }));
      }));

      await request(app.callback())
      .get('/')
        .expect(utils.shouldNotHaveHeader('X-Success'))
        .expect(404);
    })

    it('should transfer a file', async () =>{
      var app = new koa();

      app.use(wrap(function (req, res) {
        res.sendfile('test/fixtures/name.txt');
      }));

      await request(app.callback())
      .get('/')
      .expect(200, 'tobi');
    }));

    it('should transfer a directory index file', async () =>{
      var app = new koa();

      app.use(wrap(function (req, res) {
        res.sendfile('test/fixtures/blog/');
      }));

      await request(app.callback())
      .get('/')
      .expect(200, '<b>index</b>');
    }));

    it('should 404 for directory without trailing slash', async () =>{
      var app = new koa();

      app.use(wrap(function (req, res) {
        res.sendfile('test/fixtures/blog');
      }));

      await request(app.callback())
      .get('/')
      .expect(404);
    }));

    it('should transfer a file with urlencoded name', async () =>{
      var app = new koa();

      app.use(wrap(function (req, res) {
        res.sendfile('test/fixtures/%25%20of%20dogs.txt');
      }));

      await request(app.callback())
      .get('/')
      .expect(200, '20%');
    }));

    it('should not error if the client aborts', async () =>{
      var app = new koa();
      var cb = after(2)
      var error = null

      app.use(wrap(function (req, res) {
        setImmediate(function () {
          res.sendfile(path.resolve(fixtures, 'name.txt'));
          server.close(cb)
          setTimeout(function () {
            cb(error)
          }, 10)
        }));
        test.abort();
      }));

      app.use(wrap(function (err, req, res, next) {
        error = err
        next(err)
      }));

      var server = app.listen()
      var test = request(server).get('/')
      test.end()
    })

    describe('with an absolute path', function(){
      it('should transfer the file', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          res.sendfile(path.join(__dirname, '/fixtures/user.html'))
        }));

        await request(app.callback())
        .get('/')
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect(200, '<p>{{user.name}}</p>');
      })
    })

    describe('with a relative path', function(){
      it('should transfer the file', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          res.sendfile('test/fixtures/user.html');
        }));

        await request(app.callback())
        .get('/')
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect(200, '<p>{{user.name}}</p>');
      })

      it('should serve relative to "root"', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          res.sendfile('user.html', { root: 'test/fixtures/' }));
        }));

        await request(app.callback())
        .get('/')
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect(200, '<p>{{user.name}}</p>');
      })

      it('should consider ../ malicious when "root" is not set', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          res.sendfile('test/fixtures/foo/../user.html');
        }));

        await request(app.callback())
        .get('/')
        .expect(403);
      })

      it('should allow ../ when "root" is set', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          res.sendfile('foo/../user.html', { root: 'test/fixtures' }));
        }));

        await request(app.callback())
        .get('/')
        .expect(200);
      })

      it('should disallow requesting out of "root"', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          res.sendfile('foo/../../user.html', { root: 'test/fixtures' }));
        }));

        await request(app.callback())
        .get('/')
        .expect(403);
      })

      it('should next(404) when not found', async () =>{
        var app = new koa()
          , calls = 0;

        app.use(wrap(function(req, res){
          res.sendfile('user.html');
        }));

        app.use(wrap(function(req, res){
          assert(0, 'this should not be called');
        }));

        app.use(wrap(function(err, req, res, next){
          ++calls;
          next(err);
        }));

        await request(app.callback())
        .get('/')
        .end(function(err, res){
          res.statusCode.should.equal(404);
          calls.should.equal(1);
          done();
        }));
      })

      describe('with non-GET', function(){
        it('should still serve', async () =>{
          var app = new koa()

          app.use(wrap(function(req, res){
            res.sendfile(path.join(__dirname, '/fixtures/name.txt'))
          }));

          await request(app.callback())
          .get('/')
          .expect('tobi');
        })
      })
    })
  })
})

describe('.sendfile(path, options)', function () {
  it('should pass options to send module', async () =>{
    var app = new koa()

    app.use(wrap(function (req, res) {
      res.sendfile(path.resolve(fixtures, 'name.txt'), { start: 0, end: 1 })
    })

    await request(app.callback())
      .get('/')
      .expect(200, 'to')
  })
})

function createApp(path, options, fn) {
  var app = new koa();

  app.use(wrap(function (req, res) {
    res.sendFile(path, options, fn);
  }));

  return app;
}

function shouldHaveBody (buf) {
  return function (res) {
    var body = !Buffer.isBuffer(res.body)
      ? Buffer.from(res.text)
      : res.body
    assert.ok(body, 'response has body')
    assert.strictEqual(body.toString('hex'), buf.toString('hex'))
  }
}
