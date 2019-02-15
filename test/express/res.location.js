
var koa = require('koa')
  , request = require('supertest');
const wrap = require('../../lib/wrap');

describe('res', function(){
  describe('.location(url)', function(){
    it('should set the header', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.location('http://google.com').end();
      }));

      await request(app.callback())
      .get('/')
      .expect('Location', 'http://google.com')
      .expect(200)
    })

    it('should encode "url"', async () =>{
      var app = new koa()

      app.use(wrap(function (req, res) {
        res.location('https://google.com?q=\u2603 §10').end()
      })

      await request(app.callback())
      .get('/')
      .expect('Location', 'https://google.com?q=%E2%98%83%20%C2%A710')
      .expect(200)
    })

    it('should not touch already-encoded sequences in "url"', async () =>{
      var app = new koa()

      app.use(wrap(function (req, res) {
        res.location('https://google.com?q=%A710').end()
      })

      await request(app.callback())
      .get('/')
      .expect('Location', 'https://google.com?q=%A710')
      .expect(200)
    })

    describe('when url is "back"', function () {
      it('should set location from "Referer" header', async () =>{
        var app = new koa()

        app.use(wrap(function (req, res) {
          res.location('back').end()
        })

        await request(app.callback())
        .get('/')
        .set('Referer', '/some/page.html')
        .expect('Location', '/some/page.html')
        .expect(200)
      })

      it('should set location from "Referrer" header', async () =>{
        var app = new koa()

        app.use(wrap(function (req, res) {
          res.location('back').end()
        })

        await request(app.callback())
        .get('/')
        .set('Referrer', '/some/page.html')
        .expect('Location', '/some/page.html')
        .expect(200)
      })

      it('should prefer "Referrer" header', async () =>{
        var app = new koa()

        app.use(wrap(function (req, res) {
          res.location('back').end()
        })

        await request(app.callback())
        .get('/')
        .set('Referer', '/some/page1.html')
        .set('Referrer', '/some/page2.html')
        .expect('Location', '/some/page2.html')
        .expect(200)
      })

      it('should set the header to "/" without referrer', async () =>{
        var app = new koa()

        app.use(wrap(function (req, res) {
          res.location('back').end()
        })

        await request(app.callback())
        .get('/')
        .expect('Location', '/')
        .expect(200)
      })
    })
  })
})
