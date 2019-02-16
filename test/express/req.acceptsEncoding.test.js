
var koa = require('koa')
  , request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function(){
  describe('.acceptsEncoding', function(){
    it.only('should be true if encoding accepted', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        console.log(res.statusCode);
        console.log(1111);
        req.acceptsEncoding('gzip').should.be.ok()
        req.acceptsEncoding('deflate').should.be.ok()
        console.log(1111);
        res.end('aaaa');
      }));

      await request(app.callback())
      .get('/')
      .set('Accept-Encoding', ' gzip, deflate')
      .expect(200);
    })

    it('should be false if encoding not accepted', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        req.acceptsEncoding('bogus').should.not.be.ok()
        res.end();
      }));

      await request(app.callback())
      .get('/')
      .set('Accept-Encoding', ' gzip, deflate')
      .expect(200);
    })
  })
})
