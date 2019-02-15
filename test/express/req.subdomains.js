
var koa = require('koa')
  , request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function(){
  describe('.subdomains', function(){
    describe('when present', function(){
      it('should return an array', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          res.send(req.subdomains);
        }));

        await request(app.callback())
        .get('/')
        .set('Host', 'tobi.ferrets.example.com')
        .expect(200, ['ferrets', 'tobi']);
      })

      it('should work with IPv4 address', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          res.send(req.subdomains);
        }));

        await request(app.callback())
        .get('/')
        .set('Host', '127.0.0.1')
        .expect(200, []);
      })

      it('should work with IPv6 address', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          res.send(req.subdomains);
        }));

        await request(app.callback())
        .get('/')
        .set('Host', '[::1]')
        .expect(200, []);
      })
    })

    describe('otherwise', function(){
      it('should return an empty array', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          res.send(req.subdomains);
        }));

        await request(app.callback())
        .get('/')
        .set('Host', 'example.com')
        .expect(200, []);
      })
    })

    describe('with no host', function(){
      it('should return an empty array', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          req.headers.host = null;
          res.send(req.subdomains);
        }));

        await request(app.callback())
        .get('/')
        .expect(200, []);
      })
    })

    describe('with trusted X-Forwarded-Host', function () {
      it('should return an array', async () =>{
        var app = new koa();

        app.set('trust proxy', true);
        app.use(wrap(function (req, res) {
          res.send(req.subdomains);
        }));

        await request(app.callback())
        .get('/')
        .set('X-Forwarded-Host', 'tobi.ferrets.example.com')
        .expect(200, ['ferrets', 'tobi']);
      })
    })

    describe('when subdomain offset is set', function(){
      describe('when subdomain offset is zero', function(){
        it('should return an array with the whole domain', async () =>{
          var app = new koa();
          app.set('subdomain offset', 0);

          app.use(wrap(function(req, res){
            res.send(req.subdomains);
          }));

          await request(app.callback())
          .get('/')
          .set('Host', 'tobi.ferrets.sub.example.com')
          .expect(200, ['com', 'example', 'sub', 'ferrets', 'tobi']);
        })

        it('should return an array with the whole IPv4', async () =>{
          var app = new koa();
          app.set('subdomain offset', 0);

          app.use(wrap(function(req, res){
            res.send(req.subdomains);
          }));

          await request(app.callback())
          .get('/')
          .set('Host', '127.0.0.1')
          .expect(200, ['127.0.0.1']);
        })

        it('should return an array with the whole IPv6', async () =>{
          var app = new koa();
          app.set('subdomain offset', 0);

          app.use(wrap(function(req, res){
            res.send(req.subdomains);
          }));

          await request(app.callback())
          .get('/')
          .set('Host', '[::1]')
          .expect(200, ['[::1]']);
        })
      })

      describe('when present', function(){
        it('should return an array', async () =>{
          var app = new koa();
          app.set('subdomain offset', 3);

          app.use(wrap(function(req, res){
            res.send(req.subdomains);
          }));

          await request(app.callback())
          .get('/')
          .set('Host', 'tobi.ferrets.sub.example.com')
          .expect(200, ['ferrets', 'tobi']);
        })
      })

      describe('otherwise', function(){
        it('should return an empty array', async () =>{
          var app = new koa();
          app.set('subdomain offset', 3);

          app.use(wrap(function(req, res){
            res.send(req.subdomains);
          }));

          await request(app.callback())
          .get('/')
          .set('Host', 'sub.example.com')
          .expect(200, []);
        })
      })
    })
  })
})
