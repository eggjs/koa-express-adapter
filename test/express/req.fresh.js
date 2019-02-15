
var koa = require('koa')
  , request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function(){
  describe('.fresh', function(){
    it('should return true when the resource is not modified', async () =>{
      var app = new koa();
      var etag = '"12345"';

      app.use(wrap(function(req, res){
        res.set('ETag', etag);
        res.send(req.fresh);
      }));

      await request(app.callback())
      .get('/')
      .set('If-None-Match', etag)
      .expect(304);
    })

    it('should return false when the resource is modified', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.set('ETag', '"123"');
        res.send(req.fresh);
      }));

      await request(app.callback())
      .get('/')
      .set('If-None-Match', '"12345"')
      .expect(200, 'false');
    })

    it('should return false without response headers', async () =>{
      var app = new koa();

      app.disable('x-powered-by')
      app.use(wrap(function(req, res){
        res.send(req.fresh);
      }));

      await request(app.callback())
      .get('/')
      .expect(200, 'false');
    })
  })
})
