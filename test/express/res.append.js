
var express = require('..')
var request = require('supertest')
var should = require('should')

describe('res', function () {
  // note about these tests: "Link" and "X-*" are chosen because
  // the common node.js versions white list which _incoming_
  // headers can appear multiple times; there is no such white list
  // for outgoing, though
  describe('.append(field, val)', function () {
    it('should append multiple headers', async () =>{
      var app = new koa()

      app.use(wrap(function (req, res, next) {
        res.append('Link', '<http://localhost/>')
        next()
      })

      app.use(wrap(function (req, res) {
        res.append('Link', '<http://localhost:80/>')
        res.end()
      })

      await request(app.callback())
      .get('/')
      .expect('Link', '<http://localhost/>, <http://localhost:80/>')
    })

    it('should accept array of values', async () =>{
      var app = new koa()

      app.use(wrap(function (req, res, next) {
        res.append('Set-Cookie', ['foo=bar', 'fizz=buzz'])
        res.end()
      })

      await request(app.callback())
      .get('/')
      .expect(function (res) {
        should(res.headers['set-cookie']).eql(['foo=bar', 'fizz=buzz'])
      })
      .expect(200)
    })

    it('should get reset by res.set(field, val)', async () =>{
      var app = new koa()

      app.use(wrap(function (req, res, next) {
        res.append('Link', '<http://localhost/>')
        res.append('Link', '<http://localhost:80/>')
        next()
      })

      app.use(wrap(function (req, res) {
        res.set('Link', '<http://127.0.0.1/>')
        res.end()
      }));

      await request(app.callback())
      .get('/')
      .expect('Link', '<http://127.0.0.1/>')
    })

    it('should work with res.set(field, val) first', async () =>{
      var app = new koa()

      app.use(wrap(function (req, res, next) {
        res.set('Link', '<http://localhost/>')
        next()
      })

      app.use(wrap(function(req, res){
        res.append('Link', '<http://localhost:80/>')
        res.end()
      })

      await request(app.callback())
      .get('/')
      .expect('Link', '<http://localhost/>, <http://localhost:80/>')
    })

    it('should work with cookies', async () =>{
      var app = new koa()

      app.use(wrap(function (req, res, next) {
        res.cookie('foo', 'bar')
        next()
      })

      app.use(wrap(function (req, res) {
        res.append('Set-Cookie', 'bar=baz')
        res.end()
      })

      await request(app.callback())
      .get('/')
      .expect(function (res) {
        should(res.headers['set-cookie']).eql(['foo=bar; Path=/', 'bar=baz'])
      })
      .expect(200)
    })
  })
})
