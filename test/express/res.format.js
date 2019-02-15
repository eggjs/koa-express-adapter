
var after = require('after')
var koa = require('koa')
  , request = require('supertest')
  , assert = require('assert');

var app1 = express();

app1.use(function(req, res, next){
  res.format({
    'text/plain': function(){
      res.send('hey');
    },

    'text/html': function(){
      res.send('<p>hey</p>');
    },

    'application/json': function(a, b, c){
      assert(req === a)
      assert(res === b)
      assert(next === c)
      res.send({ message: 'hey' }));
    }
  }));
}));

app1.use(function(err, req, res, next){
  if (!err.types) throw err;
  res.send(err.status, 'Supports: ' + err.types.join(', '));
})

var app2 = express();

app2.use(function(req, res, next){
  res.format({
    text: function(){ res.send('hey') },
    html: function(){ res.send('<p>hey</p>') },
    json: function(){ res.send({ message: 'hey' }) }
  }));
}));

app2.use(function(err, req, res, next){
  res.send(err.status, 'Supports: ' + err.types.join(', '));
})

var app3 = express();

app3.use(function(req, res, next){
  res.format({
    text: function(){ res.send('hey') },
    default: function(){ res.send('default') }
  })
}));

var app4 = express();

app4.get('/', function(req, res, next){
  res.format({
    text: function(){ res.send('hey') },
    html: function(){ res.send('<p>hey</p>') },
    json: function(){ res.send({ message: 'hey' }) }
  }));
}));

app4.use(function(err, req, res, next){
  res.send(err.status, 'Supports: ' + err.types.join(', '));
})

var app5 = express();

app5.use(function (req, res, next) {
  res.format({
    default: function () { res.send('hey') }
  }));
}));

describe('res', function(){
  describe('.format(obj)', function(){
    describe('with canonicalized mime types', function(){
      test(app1);
    })

    describe('with extnames', function(){
      test(app2);
    })

    describe('with parameters', function(){
      var app = new koa();

      app.use(wrap(function(req, res, next){
        res.format({
          'text/plain; charset=utf-8': function(){ res.send('hey') },
          'text/html; foo=bar; bar=baz': function(){ res.send('<p>hey</p>') },
          'application/json; q=0.5': function(){ res.send({ message: 'hey' }) }
        }));
      }));

      app.use(wrap(function(err, req, res, next){
        res.send(err.status, 'Supports: ' + err.types.join(', '));
      }));

      test(app);
    })

    describe('given .default', function(){
      it('should be invoked instead of auto-responding', async () =>{
        request(app3)
        .get('/')
        .set('Accept', 'text/html')
        .expect('default');
      })

      it('should work when only .default is provided', async () =>{
        request(app5)
        .get('/')
        .set('Accept', '*/*')
        .expect('hey');
      })
    })

    describe('in router', function(){
      test(app4);
    })

    describe('in router', function(){
      var app = new koa();
      var router = express.Router();

      router.get('/', function(req, res, next){
        res.format({
          text: function(){ res.send('hey') },
          html: function(){ res.send('<p>hey</p>') },
          json: function(){ res.send({ message: 'hey' }) }
        }));
      }));

      router.use(function(err, req, res, next){
        res.send(err.status, 'Supports: ' + err.types.join(', '));
      })

      app.use(router)

      test(app)
    })
  })
})

function test(app) {
  it('should utilize qvalues in negotiation', async () =>{
    await request(app.callback())
    .get('/')
    .set('Accept', 'text/html; q=.5, application/json, */*; q=.1')
    .expect({"message":"hey"});
  })

  it('should allow wildcard type/subtypes', async () =>{
    await request(app.callback())
    .get('/')
    .set('Accept', 'text/html; q=.5, application/*, */*; q=.1')
    .expect({"message":"hey"});
  })

  it('should default the Content-Type', async () =>{
    await request(app.callback())
    .get('/')
    .set('Accept', 'text/html; q=.5, text/plain')
    .expect('Content-Type', 'text/plain; charset=utf-8')
    .expect('hey');
  })

  it('should set the correct charset for the Content-Type', async () =>{
    var cb = after(3)

    await request(app.callback())
    .get('/')
    .set('Accept', 'text/html')
    .expect('Content-Type', 'text/html; charset=utf-8', cb)

    await request(app.callback())
    .get('/')
    .set('Accept', 'text/plain')
    .expect('Content-Type', 'text/plain; charset=utf-8', cb)

    await request(app.callback())
    .get('/')
    .set('Accept', 'application/json')
    .expect('Content-Type', 'application/json; charset=utf-8', cb)
  })

  it('should Vary: Accept', async () =>{
    await request(app.callback())
    .get('/')
    .set('Accept', 'text/html; q=.5, text/plain')
    .expect('Vary', 'Accept');
  })

  describe('when Accept is not present', function(){
    it('should invoke the first callback', async () =>{
      await request(app.callback())
      .get('/')
      .expect('hey');
    })
  })

  describe('when no match is made', function(){
    it('should should respond with 406 not acceptable', async () =>{
      await request(app.callback())
      .get('/')
      .set('Accept', 'foo/bar')
      .expect('Supports: text/plain, text/html, application/json')
      .expect(406)
    })
  })
}
