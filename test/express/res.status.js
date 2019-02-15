
var koa = require('koa')
  , request = require('supertest');
const wrap = require('../../lib/wrap');

describe('res', function(){
  describe('.status(code)', function(){
    it('should set the response .statusCode', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.status(201).end('Created');
      }));

      await request(app.callback())
      .get('/')
      .expect('Created')
      .expect(201);
    })
  })
})
