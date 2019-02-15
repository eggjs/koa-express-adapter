
var koa = require('koa')
  , request = require('supertest');
const wrap = require('../../lib/wrap');

describe('res', function(){
  describe('.locals', function(){
    it('should be empty by default', async () =>{
      var app = new koa();

      app.use(wrap(function(req, res){
        Object.keys(res.locals).should.eql([]);
        res.end();
      }));

      await request(app.callback())
      .get('/')
      .expect(200);
    })
  })

  it('should work when mounted', async () =>{
    var app = new koa();
    var blog = express();

    app.use(blog);

    blog.use(function(req, res, next){
      res.locals.foo = 'bar';
      next();
    }));

    app.use(wrap(function(req, res){
      res.locals.foo.should.equal('bar');
      res.end();
    }));

    await request(app.callback())
    .get('/')
    .expect(200);
  })
})
