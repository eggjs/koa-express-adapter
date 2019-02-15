
var koa = require('koa')
  , request = require('supertest')
  , assert = require('assert');

describe('req', function(){
  describe('.get(field)', function(){
    it('should return the header field value', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        assert(req.get('Something-Else') === undefined);
        res.end(req.get('Content-Type'));
      }));

      await request(app.callback())
      .post('/')
      .set('Content-Type', 'application/json')
      .expect('application/json');
    })

    it('should special-case Referer', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.end(req.get('Referer'));
      }));

      await request(app.callback())
      .post('/')
      .set('Referrer', 'http://foobar.com')
      .expect('http://foobar.com');
    })

    it('should throw missing header name', async () =>{
      var app = new koa()

      app.use(wrap(function (req, res) {
        res.end(req.get())
      })

      await request(app.callback())
      .get('/')
      .expect(500, /TypeError: name argument is required to req.get/)
    })

    it('should throw for non-string header name', async () =>{
      var app = new koa()

      app.use(wrap(function (req, res) {
        res.end(req.get(42))
      })

      await request(app.callback())
      .get('/')
      .expect(500, /TypeError: name must be a string to req.get/)
    })
  })
})
