
var koa = require('koa')
  , request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function(){
  describe('.protocol', function(){
    it('should return the protocol string', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.end(req.protocol);
      }));

      await request(app.callback())
      .get('/')
      .expect('http');
    })

    describe('when "trust proxy" is enabled', function(){
      it('should respect X-Forwarded-Proto', async () =>{
        var app = new koa();

        app.enable('trust proxy');

        app.use(wrap(function(req, res){
          res.end(req.protocol);
        }));

        await request(app.callback())
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .expect('https');
      })

      it('should default to the socket addr if X-Forwarded-Proto not present', async () =>{
        var app = new koa();

        app.enable('trust proxy');

        app.use(wrap(function(req, res){
          req.connection.encrypted = true;
          res.end(req.protocol);
        }));

        await request(app.callback())
        .get('/')
        .expect('https');
      })

      it('should ignore X-Forwarded-Proto if socket addr not trusted', async () =>{
        var app = new koa();

        app.set('trust proxy', '10.0.0.1');

        app.use(wrap(function(req, res){
          res.end(req.protocol);
        }));

        await request(app.callback())
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .expect('http');
      })

      it('should default to http', async () =>{
        var app = new koa();

        app.enable('trust proxy');

        app.use(wrap(function(req, res){
          res.end(req.protocol);
        }));

        await request(app.callback())
        .get('/')
        .expect('http');
      })

      describe('when trusting hop count', function () {
        it('should respect X-Forwarded-Proto', async () =>{
          var app = new koa();

          app.set('trust proxy', 1);

          app.use(wrap(function (req, res) {
            res.end(req.protocol);
          }));

          await request(app.callback())
          .get('/')
          .set('X-Forwarded-Proto', 'https')
          .expect('https');
        })
      })
    })

    describe('when "trust proxy" is disabled', function(){
      it('should ignore X-Forwarded-Proto', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          res.end(req.protocol);
        }));

        await request(app.callback())
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .expect('http');
      })
    })
  })
})
