
const koa = require('koa');
const request = require('supertest');
const wrap = require('../../lib/wrap');

describe('res', function() {
  describe('.get(field)', function() {
    it('should get the response header field', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.setHeader('Content-Type', 'text/x-foo');
        res.send(res.get('Content-Type'));
      }));

      await request(app.callback())
        .get('/')
        .expect(200, 'text/x-foo');
    });
  });
});
