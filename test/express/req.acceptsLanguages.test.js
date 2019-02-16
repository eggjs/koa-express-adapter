
var koa = require('koa')
  , request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function(){
  describe('.acceptsLanguages', function(){
    it('should be true if language accepted', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        req.acceptsLanguages('en-us').should.be.ok()
        req.acceptsLanguages('en').should.be.ok()
        res.end();
      }));

      await request(app.callback())
      .get('/')
      .set('Accept-Language', 'en;q=.5, en-us')
      .expect(200);
    })

    it('should be false if language not accepted', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        req.acceptsLanguages('es').should.not.be.ok()
        res.end();
      }));

      await request(app.callback())
      .get('/')
      .set('Accept-Language', 'en;q=.5, en-us')
      .expect(200);
    })

    describe('when Accept-Language is not present', function(){
      it('should always return true', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          req.acceptsLanguages('en').should.be.ok()
          req.acceptsLanguages('es').should.be.ok()
          req.acceptsLanguages('jp').should.be.ok()
          res.end();
        }));

        await request(app.callback())
        .get('/')
        .expect(200);
      })
    })
  })
})
