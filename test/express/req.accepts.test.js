
var koa = require('koa');
var request = require('supertest');
var wrap = require('../../lib/wrap');

describe.only('req', function(){
  describe('.accepts(type)', function(){
    it('should return true when Accept is not present', async () => {
      var app = new koa();

      app.use(wrap(function(req, res){
        res.end(req.accepts('json') ? 'yes' : 'no');
      }));

      await request(app.callback())
        .get('/')
        .expect('yes');
    })

    it('should return true when present', async () => {
      var app = new koa();

      app.use(wrap(function(req, res, next){
        res.end(req.accepts('json') ? 'yes' : 'no');
      }));

      await request(app.callback())
      .get('/')
      .set('Accept', 'application/json')
      .expect('yes');
    })

    it('should return false otherwise', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res, next){
        res.end(req.accepts('json') ? 'yes' : 'no');
      }));

      await request(app.callback())
      .get('/')
      .set('Accept', 'text/html')
      .expect('no');
    })
  })

  it('should accept an argument list of type names', async () =>{
    var app = new koa();

    app.use(wrap(function(req, res, next){
      res.end(req.accepts('json', 'html'));
    }));

    await request(app.callback())
    .get('/')
    .set('Accept', 'application/json')
    .expect('json');
  })

  describe('.accepts(types)', function(){
    it('should return the first when Accept is not present', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res, next){
        res.end(req.accepts(['json', 'html']));
      }));

      await request(app.callback())
      .get('/')
      .expect('json');
    })

    it('should return the first acceptable type', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res, next){
        res.end(req.accepts(['json', 'html']));
      }));

      await request(app.callback())
      .get('/')
      .set('Accept', 'text/html')
      .expect('html');
    })

    it('should return false when no match is made', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res, next){
        res.end(req.accepts(['text/html', 'application/json']) ? 'yup' : 'nope');
      }));

      await request(app.callback())
      .get('/')
      .set('Accept', 'foo/bar, bar/baz')
      .expect('nope');
    })

    it('should take quality into account', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res, next){
        res.end(req.accepts(['text/html', 'application/json']));
      }));

      await request(app.callback())
      .get('/')
      .set('Accept', '*/html; q=.5, application/json')
      .expect('application/json');
    })

    it('should return the first acceptable type with canonical mime types', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res, next){
        res.end(req.accepts(['application/json', 'text/html']));
      }));

      await request(app.callback())
      .get('/')
      .set('Accept', '*/html')
      .expect('text/html');
    })
  })
})
