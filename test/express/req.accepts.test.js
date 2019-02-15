
var koa = require('koa');
var request = require('supertest');
var wrap = require('../../lib/wrap');

describe('req', function(){
  describe('.accepts(type)', function(){
    it.only('should return true when Accept is not present', async () => {
      var app = new koa();

      app.use(wrap(function(req, res){
        console.log(req.accepts);
        console.log(req.accepts('json'));
        res.end(req.accepts('json') ? 'yes' : 'no');
      }));

      await request(app.callback())
        .get('/')
        .expect('yes');
    })

    it('should return true when present', function(done){
      var app = new koa();

      app.use(function(req, res, next){
        res.end(req.accepts('json') ? 'yes' : 'no');
      });

      request(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect('yes', done);
    })

    it('should return false otherwise', function(done){
      var app = new koa();

      app.use(function(req, res, next){
        res.end(req.accepts('json') ? 'yes' : 'no');
      });

      request(app)
      .get('/')
      .set('Accept', 'text/html')
      .expect('no', done);
    })
  })

  it('should accept an argument list of type names', function(done){
    var app = new koa();

    app.use(function(req, res, next){
      res.end(req.accepts('json', 'html'));
    });

    request(app)
    .get('/')
    .set('Accept', 'application/json')
    .expect('json', done);
  })

  describe('.accepts(types)', function(){
    it('should return the first when Accept is not present', function(done){
      var app = new koa();

      app.use(function(req, res, next){
        res.end(req.accepts(['json', 'html']));
      });

      request(app)
      .get('/')
      .expect('json', done);
    })

    it('should return the first acceptable type', function(done){
      var app = new koa();

      app.use(function(req, res, next){
        res.end(req.accepts(['json', 'html']));
      });

      request(app)
      .get('/')
      .set('Accept', 'text/html')
      .expect('html', done);
    })

    it('should return false when no match is made', function(done){
      var app = new koa();

      app.use(function(req, res, next){
        res.end(req.accepts(['text/html', 'application/json']) ? 'yup' : 'nope');
      });

      request(app)
      .get('/')
      .set('Accept', 'foo/bar, bar/baz')
      .expect('nope', done);
    })

    it('should take quality into account', function(done){
      var app = new koa();

      app.use(function(req, res, next){
        res.end(req.accepts(['text/html', 'application/json']));
      });

      request(app)
      .get('/')
      .set('Accept', '*/html; q=.5, application/json')
      .expect('application/json', done);
    })

    it('should return the first acceptable type with canonical mime types', function(done){
      var app = new koa();

      app.use(function(req, res, next){
        res.end(req.accepts(['application/json', 'text/html']));
      });

      request(app)
      .get('/')
      .set('Accept', '*/html')
      .expect('text/html', done);
    })
  })
})
