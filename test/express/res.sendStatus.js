
var express = require('..')
var request = require('supertest')

describe('res', function () {
  describe('.sendStatus(statusCode)', function () {
    it('should send the status code and message as body', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.sendStatus(201);
      }));

      await request(app.callback())
      .get('/')
      .expect(201, 'Created');
    })

    it('should work with unknown code', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.sendStatus(599);
      }));

      await request(app.callback())
      .get('/')
      .expect(599, '599');
    })
  })
})
