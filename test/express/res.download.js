
var after = require('after');
var assert = require('assert');
var Buffer = require('safe-buffer').Buffer
var express = require('..');
var request = require('supertest');
const wrap = require('../../lib/wrap');

describe('res', function(){
  describe('.download(path)', function(){
    it('should transfer as an attachment', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.download('test/fixtures/user.html');
      }));

      await request(app.callback())
      .get('/')
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect('Content-Disposition', 'attachment; filename="user.html"')
      .expect(200, '<p>{{user.name}}</p>')
    })
  })

  describe('.download(path, filename)', function(){
    it('should provide an alternate filename', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.download('test/fixtures/user.html', 'document');
      }));

      await request(app.callback())
      .get('/')
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect('Content-Disposition', 'attachment; filename="document"')
      .expect(200)
    })
  })

  describe('.download(path, fn)', function(){
    it('should invoke the callback', async () =>{
      var app = new koa();
      var cb = after(2);

      app.use(wrap(function(req, res){
        res.download('test/fixtures/user.html', cb);
      }));

      await request(app.callback())
      .get('/')
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect('Content-Disposition', 'attachment; filename="user.html"')
      .expect(200, cb);
    })
  })

  describe('.download(path, filename, fn)', function(){
    it('should invoke the callback', async () =>{
      var app = new koa();
      var cb = after(2);

      app.use(wrap(function(req, res){
        res.download('test/fixtures/user.html', 'document');
      }));

      await request(app.callback())
      .get('/')
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect('Content-Disposition', 'attachment; filename="document"')
      .expect(200, cb);
    })
  })

  describe('.download(path, filename, options, fn)', function () {
    it('should invoke the callback', async () =>{
      var app = new koa()
      var cb = after(2)
      var options = {}

      app.use(wrap(function (req, res) {
        res.download('test/fixtures/user.html', 'document', options)
      })

      await request(app.callback())
      .get('/')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect('Content-Disposition', 'attachment; filename="document"')
      .end(cb)
    })

    it('should allow options to res.sendFile()', async () =>{
      var app = new koa()

      app.use(wrap(function (req, res) {
        res.download('test/fixtures/.name', 'document', {
          dotfiles: 'allow',
          maxAge: '4h'
        })
      })

      await request(app.callback())
      .get('/')
      .expect(200)
      .expect('Content-Disposition', 'attachment; filename="document"')
      .expect('Cache-Control', 'public, max-age=14400')
      .expect(shouldHaveBody(Buffer.from('tobi')))
      .end(done)
    })

    describe('when options.headers contains Content-Disposition', function () {
      it('should should be ignored', async () =>{
        var app = new koa()

        app.use(wrap(function (req, res) {
          res.download('test/fixtures/user.html', 'document', {
            headers: {
              'Content-Type': 'text/x-custom',
              'Content-Disposition': 'inline'
            }
          })
        })

        await request(app.callback())
        .get('/')
        .expect(200)
        .expect('Content-Type', 'text/x-custom')
        .expect('Content-Disposition', 'attachment; filename="document"')
        .end(done)
      })

      it('should should be ignored case-insensitively', async () =>{
        var app = new koa()

        app.use(wrap(function (req, res) {
          res.download('test/fixtures/user.html', 'document', {
            headers: {
              'content-type': 'text/x-custom',
              'content-disposition': 'inline'
            }
          })
        })

        await request(app.callback())
        .get('/')
        .expect(200)
        .expect('Content-Type', 'text/x-custom')
        .expect('Content-Disposition', 'attachment; filename="document"')
        .end(done)
      })
    })
  })

  describe('on failure', function(){
    it('should invoke the callback', async () =>{
      var app = new koa();

      app.use(wrap(function (req, res, next) {
        res.download('test/fixtures/foobar.html', function(err){
          if (!err) return next(new Error('expected error'));
          res.send('got ' + err.status + ' ' + err.code);
        }));
      }));

      await request(app.callback())
      .get('/')
      .expect(200, 'got 404 ENOENT');
    })

    it('should remove Content-Disposition', async () =>{
      var app = new koa()

      app.use(wrap(function (req, res, next) {
        res.download('test/fixtures/foobar.html', function(err){
          if (!err) return next(new Error('expected error'));
          res.end('failed');
        }));
      }));

      await request(app.callback())
      .get('/')
      .expect(shouldNotHaveHeader('Content-Disposition'))
      .expect(200, 'failed');
    })
  })
})

function shouldHaveBody (buf) {
  return function (res) {
    var body = !Buffer.isBuffer(res.body)
      ? Buffer.from(res.text)
      : res.body
    assert.ok(body, 'response has body')
    assert.strictEqual(body.toString('hex'), buf.toString('hex'))
  }
}

function shouldNotHaveHeader(header) {
  return function (res) {
    assert.ok(!(header.toLowerCase() in res.headers), 'should not have header ' + header);
  };
}
