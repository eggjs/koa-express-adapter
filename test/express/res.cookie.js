
var koa = require('koa')
  , request = require('supertest')
  , cookie = require('cookie')
  , cookieParser = require('cookie-parser')
var merge = require('utils-merge');

describe('res', function(){
  describe('.cookie(name, object)', function(){
    it('should generate a JSON cookie', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.cookie('user', { name: 'tobi' }).end();
      }));

      await request(app.callback())
      .get('/')
      .expect('Set-Cookie', 'user=j%3A%7B%22name%22%3A%22tobi%22%7D; Path=/')
      .expect(200)
    })
  })

  describe('.cookie(name, string)', function(){
    it('should set a cookie', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.cookie('name', 'tobi').end();
      }));

      await request(app.callback())
      .get('/')
      .expect('Set-Cookie', 'name=tobi; Path=/')
      .expect(200)
    })

    it('should allow multiple calls', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.cookie('name', 'tobi');
        res.cookie('age', 1);
        res.cookie('gender', '?');
        res.end();
      }));

      await request(app.callback())
      .get('/')
      .end(function(err, res){
        var val = ['name=tobi; Path=/', 'age=1; Path=/', 'gender=%3F; Path=/'];
        res.headers['set-cookie'].should.eql(val);
        done();
      })
    })
  })

  describe('.cookie(name, string, options)', function(){
    it('should set params', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        res.cookie('name', 'tobi', { httpOnly: true, secure: true }));
        res.end();
      }));

      await request(app.callback())
      .get('/')
      .expect('Set-Cookie', 'name=tobi; Path=/; HttpOnly; Secure')
      .expect(200)
    })

    describe('maxAge', function(){
      it('should set relative expires', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          res.cookie('name', 'tobi', { maxAge: 1000 }));
          res.end();
        }));

        await request(app.callback())
        .get('/')
        .end(function(err, res){
          res.headers['set-cookie'][0].should.not.containEql('Thu, 01 Jan 1970 00:00:01 GMT');
          done();
        })
      })

      it('should set max-age', async () =>{
        var app = new koa();

        app.use(wrap(function(req, res){
          res.cookie('name', 'tobi', { maxAge: 1000 }));
          res.end();
        }));

        await request(app.callback())
        .get('/')
        .expect('Set-Cookie', /Max-Age=1/)
      })

      it('should not mutate the options object', async () =>{
        var app = new koa();

        var options = { maxAge: 1000 };
        var optionsCopy = merge({}, options);

        app.use(wrap(function(req, res){
          res.cookie('name', 'tobi', options)
          res.end();
        }));

        await request(app.callback())
        .get('/')
        .end(function(err, res){
          options.should.eql(optionsCopy);
          done();
        })
      })
    })

    describe('signed', function(){
      it('should generate a signed JSON cookie', async () =>{
        var app = new koa();

        app.use(cookieParser('foo bar baz'));

        app.use(wrap(function(req, res){
          res.cookie('user', { name: 'tobi' }, { signed: true }).end();
        }));

        await request(app.callback())
        .get('/')
        .end(function(err, res){
          var val = res.headers['set-cookie'][0];
          val = cookie.parse(val.split('.')[0]);
          val.user.should.equal('s:j:{"name":"tobi"}');
          done();
        })
      })
    })

    describe('signed without secret', function(){
      it('should throw an error', async () =>{
        var app = new koa();

        app.use(cookieParser());

        app.use(wrap(function(req, res){
          res.cookie('name', 'tobi', { signed: true }).end();
        }));

        await request(app.callback())
        .get('/')
        .expect(500, /secret\S+ required for signed cookies/);
      })
    })

    describe('.signedCookie(name, string)', function(){
      it('should set a signed cookie', async () =>{
        var app = new koa();

        app.use(cookieParser('foo bar baz'));

        app.use(wrap(function(req, res){
          res.cookie('name', 'tobi', { signed: true }).end();
        }));

        await request(app.callback())
        .get('/')
        .expect('Set-Cookie', 'name=s%3Atobi.xJjV2iZ6EI7C8E5kzwbfA9PVLl1ZR07UTnuTgQQ4EnQ; Path=/')
        .expect(200)
      })
    })
  })
})
