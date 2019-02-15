
var assert = require('assert')
var express = require('..');
var request = require('supertest');
const wrap = require('../../lib/wrap');
var utils = require('./support/utils');

describe('res', function(){
  describe('.redirect(url)', function(){
    it('should default to a 302 redirect', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.redirect('http://google.com');
      }));

      await request(app.callback())
      .get('/')
      .expect('location', 'http://google.com')
      .expect(302)
    })

    it('should encode "url"', async () =>{
      var app = new koa()

      app.use(wrap(function (req, res) {
        res.redirect('https://google.com?q=\u2603 §10')
      })

      await request(app.callback())
      .get('/')
      .expect('Location', 'https://google.com?q=%E2%98%83%20%C2%A710')
      .expect(302)
    })

    it('should not touch already-encoded sequences in "url"', async () =>{
      var app = new koa()

      app.use(wrap(function (req, res) {
        res.redirect('https://google.com?q=%A710')
      })

      await request(app.callback())
      .get('/')
      .expect('Location', 'https://google.com?q=%A710')
      .expect(302)
    })
  })

  describe('.redirect(status, url)', function(){
    it('should set the response status', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.redirect(303, 'http://google.com');
      }));

      await request(app.callback())
      .get('/')
      .expect('Location', 'http://google.com')
      .expect(303)
    })
  })

  describe('.redirect(url, status)', function(){
    it('should set the response status', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.redirect('http://google.com', 303);
      }));

      await request(app.callback())
      .get('/')
      .expect('Location', 'http://google.com')
      .expect(303)
    })
  })

  describe('when the request method is HEAD', function(){
    it('should ignore the body', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.redirect('http://google.com');
      }));

      await request(app.callback())
      .head('/')
      .expect(302)
      .expect('Location', 'http://google.com')
      .expect(shouldNotHaveBody())
      .end(done)
    })
  })

  describe('when accepting html', function(){
    it('should respond with html', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.redirect('http://google.com');
      }));

      await request(app.callback())
      .get('/')
      .set('Accept', 'text/html')
      .expect('Content-Type', /html/)
      .expect('Location', 'http://google.com')
      .expect(302, '<p>Found. Redirecting to <a href="http://google.com">http://google.com</a></p>')
    })

    it('should escape the url', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.redirect('<la\'me>');
      }));

      await request(app.callback())
      .get('/')
      .set('Host', 'http://example.com')
      .set('Accept', 'text/html')
      .expect('Content-Type', /html/)
      .expect('Location', '%3Cla\'me%3E')
      .expect(302, '<p>Found. Redirecting to <a href="%3Cla&#39;me%3E">%3Cla&#39;me%3E</a></p>')
    })

    it('should include the redirect type', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.redirect(301, 'http://google.com');
      }));

      await request(app.callback())
      .get('/')
      .set('Accept', 'text/html')
      .expect('Content-Type', /html/)
      .expect('Location', 'http://google.com')
      .expect(301, '<p>Moved Permanently. Redirecting to <a href="http://google.com">http://google.com</a></p>');
    })
  })

  describe('when accepting text', function(){
    it('should respond with text', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.redirect('http://google.com');
      }));

      await request(app.callback())
      .get('/')
      .set('Accept', 'text/plain, */*')
      .expect('Content-Type', /plain/)
      .expect('Location', 'http://google.com')
      .expect(302, 'Found. Redirecting to http://google.com')
    })

    it('should encode the url', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.redirect('http://example.com/?param=<script>alert("hax");</script>');
      }));

      await request(app.callback())
      .get('/')
      .set('Host', 'http://example.com')
      .set('Accept', 'text/plain, */*')
      .expect('Content-Type', /plain/)
      .expect('Location', 'http://example.com/?param=%3Cscript%3Ealert(%22hax%22);%3C/script%3E')
      .expect(302, 'Found. Redirecting to http://example.com/?param=%3Cscript%3Ealert(%22hax%22);%3C/script%3E')
    })

    it('should include the redirect type', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.redirect(301, 'http://google.com');
      }));

      await request(app.callback())
      .get('/')
      .set('Accept', 'text/plain, */*')
      .expect('Content-Type', /plain/)
      .expect('Location', 'http://google.com')
      .expect(301, 'Moved Permanently. Redirecting to http://google.com');
    })
  })

  describe('when accepting neither text or html', function(){
    it('should respond with an empty body', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.redirect('http://google.com');
      }));

      await request(app.callback())
      .get('/')
      .set('Accept', 'application/octet-stream')
      .expect(302)
      .expect('location', 'http://google.com')
      .expect('content-length', '0')
      .expect(utils.shouldNotHaveHeader('Content-Type'))
      .expect(shouldNotHaveBody())
      .end(done)
    })
  })
})

function shouldNotHaveBody () {
  return function (res) {
    assert.ok(res.text === '' || res.text === undefined)
  }
}
