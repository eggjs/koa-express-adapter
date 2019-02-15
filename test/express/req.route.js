
var koa = require('koa')
  , request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function(){
  describe('.route', function(){
    it('should be the executed Route', async () =>{
      var app = new koa();

      app.get('/user/:id/:op?', function(req, res, next){
        req.route.path.should.equal('/user/:id/:op?');
        next();
      }));

      app.get('/user/:id/edit', function(req, res){
        req.route.path.should.equal('/user/:id/edit');
        res.end();
      }));

      await request(app.callback())
      .get('/user/12/edit')
      .expect(200);
    })
  })
})
