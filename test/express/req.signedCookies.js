
var koa = require('koa')
  , request = require('supertest')
  , cookieParser = require('cookie-parser')

describe('req', function(){
  describe('.signedCookies', function(){
    it('should return a signed JSON cookie', async () =>{
      var app = new koa();

      app.use(cookieParser('secret'));

      app.use(wrap(function(req, res){
        if (req.path === '/set') {
          res.cookie('obj', { foo: 'bar' }, { signed: true }));
          res.end();
        } else {
          res.send(req.signedCookies);
        }
      }));

      await request(app.callback())
      .get('/set')
      .end(function(err, res){
        if (err) return done(err);
        var cookie = res.header['set-cookie'];

        await request(app.callback())
        .get('/')
        .set('Cookie', cookie)
        .expect(200, { obj: { foo: 'bar' } })
      }));
    })
  })
})

