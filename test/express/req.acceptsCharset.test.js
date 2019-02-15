
var koa = require('koa')
  , request = require('supertest');
const wrap = require('../../lib/wrap');

describe.only('req', function(){
  describe('.acceptsCharset(type)', function(){
    describe('when Accept-Charset is not present', function(){
      it('should return true', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res, next){
          res.end(req.acceptsCharset('utf-8') ? 'yes' : 'no');
        }));

        await request(app.callback())
        .get('/')
        .expect('yes');
      })
    })

    describe('when Accept-Charset is not present', function(){
      it('should return true when present', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res, next){
          res.end(req.acceptsCharset('utf-8') ? 'yes' : 'no');
        }));

        await request(app.callback())
        .get('/')
        .set('Accept-Charset', 'foo, bar, utf-8')
        .expect('yes');
      })

      it('should return false otherwise', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res, next){
          res.end(req.acceptsCharset('utf-8') ? 'yes' : 'no');
        }));

        await request(app.callback())
        .get('/')
        .set('Accept-Charset', 'foo, bar')
        .expect('no');
      })
    })
  })
})
