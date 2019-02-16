'use strict';


const koa = require('koa');

describe('test/wrap.test.js', () => {

  it('b', async () => {
    app = new koa();
    app.use(wrap(function(req, res, next) {
      setTimeout(() => {
        next();
      }, 1000);
    }));
    app.use(wrap(function(req, res) {
      res.send('a');
    }));

    request(app.callback())
      .get('/')
      .expect({});
  });

});
